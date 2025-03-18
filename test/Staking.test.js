const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let rewardDistributor;
  let yieldPool;
  let staking;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy staking contract
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy();
    
    // Deploy reward distributor
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistributor = await RewardDistribution.deploy();
    
    // Deploy yield pool
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy();
    
    // Set up staking contract
    await staking.setRewardDistributor(rewardDistributor.target);
    await staking.setYieldPool(yieldPool.target);
    
    // Fund the reward distributor with some CORE tokens
    await owner.sendTransaction({
      to: rewardDistributor.target,
      value: ethers.parseEther("10")
    });
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await staking.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total staked", async function () {
      expect(await staking.totalStaked()).to.equal(0);
    });
    
    it("Should have MIN_STAKE_PERIOD of 7 days", async function () {
      const MIN_STAKE_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
      expect(await staking.MIN_STAKE_PERIOD()).to.equal(MIN_STAKE_PERIOD);
    });
    
    it("Should have PENALTY_RATE of 5%", async function () {
      expect(await staking.PENALTY_RATE()).to.equal(500);
    });
  });

  describe("Setting Dependencies", function () {
    it("Should set reward distributor correctly", async function () {
      expect(await staking.rewardDistributor()).to.equal(rewardDistributor.target);
    });
    
    it("Should set yield pool correctly", async function () {
      expect(await staking.yieldPool()).to.equal(yieldPool.target);
    });
    
    it("Should not allow non-owners to set reward distributor", async function () {
      await expect(
        staking.connect(user1).setRewardDistributor(rewardDistributor.target)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
    
    it("Should not allow non-owners to set yield pool", async function () {
      await expect(
        staking.connect(user1).setYieldPool(yieldPool.target)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake CORE tokens", async function () {
      const stakeAmount = ethers.parseEther("1");
      
      // Stake CORE tokens
      await staking.connect(user1).stake({ value: stakeAmount });
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(stakeAmount);
      
      // Check contract's CORE balance
      expect(await ethers.provider.getBalance(staking.target)).to.equal(stakeAmount);
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(stakeAmount);
    });
    
    it("Should update last staked time on stake", async function () {
      const stakeAmount = ethers.parseEther("1");
      
      const blockBefore = await ethers.provider.getBlock("latest");
      const txReceipt = await staking.connect(user1).stake({ value: stakeAmount });
      const blockAfter = await ethers.provider.getBlock(txReceipt.blockNumber);
      
      const userStake = await staking.stakes(user1.address);
      expect(userStake.lastStakedTime).to.equal(blockAfter.timestamp);
    });
    
    it("Should fail if trying to stake zero CORE tokens", async function () {
      await expect(
        staking.connect(user1).stake({ value: 0 })
      ).to.be.revertedWith("Cannot stake zero CORE tokens");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      // Stake some tokens first
      const stakeAmount = ethers.parseEther("5");
      await staking.connect(user1).stake({ value: stakeAmount });
    });
    
    it("Should allow users to unstake tokens after minimum stake period with no penalty", async function () {
      const unstakeAmount = ethers.parseEther("2");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Fast forward time past minimum stake period
      const minStakePeriod = await staking.MIN_STAKE_PERIOD();
      await ethers.provider.send("evm_increaseTime", [minStakePeriod.toString()]);
      await ethers.provider.send("evm_mine");
      
      // Unstake tokens
      const unstakeTx = await staking.connect(user1).unstake(unstakeAmount);
      const gasUsed = (await unstakeTx.wait()).gasUsed * (await unstakeTx.wait()).gasPrice;
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(ethers.parseEther("3")); // 5 - 2
      
      // Check user received full amount (no penalty)
      // Account for gas costs in the balance check
      const expectedBalance = initialBalance + unstakeAmount - gasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.01") // Allow for small rounding differences
      );
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("3"));
    });
    
    it("Should apply penalty when unstaking before minimum stake period", async function () {
      const unstakeAmount = ethers.parseEther("2");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Unstake tokens immediately (before minimum stake period)
      const unstakeTx = await staking.connect(user1).unstake(unstakeAmount);
      const gasUsed = (await unstakeTx.wait()).gasUsed * (await unstakeTx.wait()).gasPrice;
      
      // Calculate expected penalty (5%)
      const penaltyRate = await staking.PENALTY_RATE();
      const expectedPenalty = unstakeAmount * penaltyRate / 10000n;
      const expectedReceived = unstakeAmount - expectedPenalty;
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(ethers.parseEther("3")); // 5 - 2
      
      // Check user received amount minus penalty
      // Account for gas costs in the balance check
      const expectedBalance = initialBalance + expectedReceived - gasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.01") // Allow for small rounding differences
      );
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("3"));
    });
    
    it("Should fail if trying to unstake more than staked", async function () {
      const excessiveAmount = ethers.parseEther("10"); // User only staked 5
      
      await expect(
        staking.connect(user1).unstake(excessiveAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Claiming Rewards", function () {
    beforeEach(async function () {
      // Stake some tokens first
      const stakeAmount = ethers.parseEther("5");
      await staking.connect(user1).stake({ value: stakeAmount });
    });
    
    it("Should allow users to claim rewards based on staked amount", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Claim rewards
      const claimTx = await staking.connect(user1).claimReward();
      const gasUsed = (await claimTx.wait()).gasUsed * (await claimTx.wait()).gasPrice;
      
      // The amount of rewards should be equal to the user's staked amount
      // Account for gas costs in the balance check
      const expectedBalance = initialBalance + ethers.parseEther("5") - gasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.01") // Allow for small rounding differences
      );
    });
  });

  describe("View Functions", function () {
    it("Should return the total staked amount", async function () {
      expect(await staking.getTotalStaked()).to.equal(0);
      
      const stakeAmount = ethers.parseEther("1");
      await staking.connect(user1).stake({ value: stakeAmount });
      
      expect(await staking.getTotalStaked()).to.equal(stakeAmount);
    });
  });
}); 