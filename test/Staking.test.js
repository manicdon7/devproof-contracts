const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let stakingToken;
  let rewardToken;
  let rewardDistributor;
  let yieldPool;
  let staking;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy staking token
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy();
    
    // Deploy reward token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    
    // Deploy staking contract
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(stakingToken.target);
    
    // Deploy reward distributor
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistributor = await RewardDistribution.deploy(rewardToken.target);
    
    // Deploy yield pool
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy(rewardToken.target);
    
    // Set up staking contract
    await staking.setRewardDistributor(rewardDistributor.target);
    await staking.setYieldPool(yieldPool.target);
    
    // Mint some tokens to users for testing
    const mintAmount = ethers.parseEther("1000");
    await stakingToken.mint(user1.address, mintAmount);
    await stakingToken.mint(user2.address, mintAmount);
    
    // Transfer some reward tokens to reward distributor
    const rewardAmount = ethers.parseEther("10000");
    await rewardToken.transfer(rewardDistributor.target, rewardAmount);
  });

  describe("Deployment", function () {
    it("Should set the staking token correctly", async function () {
      expect(await staking.stakingToken()).to.equal(stakingToken.target);
    });

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
    it("Should allow users to stake tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      
      // Approve staking contract
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      
      // Stake tokens
      await staking.connect(user1).stake(stakeAmount);
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(stakeAmount);
      
      // Check contract's token balance
      expect(await stakingToken.balanceOf(staking.target)).to.equal(stakeAmount);
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(stakeAmount);
    });
    
    it("Should update last staked time on stake", async function () {
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      
      const blockBefore = await ethers.provider.getBlock("latest");
      const txReceipt = await staking.connect(user1).stake(stakeAmount);
      const blockAfter = await ethers.provider.getBlock(txReceipt.blockNumber);
      
      const userStake = await staking.stakes(user1.address);
      expect(userStake.lastStakedTime).to.equal(blockAfter.timestamp);
    });
    
    it("Should fail if trying to stake zero tokens", async function () {
      await expect(
        staking.connect(user1).stake(0)
      ).to.be.revertedWith("Cannot stake zero tokens");
    });
    
    it("Should fail if not approved enough tokens", async function () {
      const stakeAmount = ethers.parseEther("100");
      // Not approving tokens
      
      await expect(
        staking.connect(user1).stake(stakeAmount)
      ).to.be.reverted; // SafeERC20: low-level call failed
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      // Stake some tokens first
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });
    
    it("Should allow users to unstake tokens after minimum stake period with no penalty", async function () {
      const unstakeAmount = ethers.parseEther("50");
      const initialBalance = await stakingToken.balanceOf(user1.address);
      
      // Fast forward time past minimum stake period
      const minStakePeriod = await staking.MIN_STAKE_PERIOD();
      await ethers.provider.send("evm_increaseTime", [minStakePeriod.toString()]);
      await ethers.provider.send("evm_mine");
      
      // Unstake tokens
      await staking.connect(user1).unstake(unstakeAmount);
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(ethers.parseEther("50")); // 100 - 50
      
      // Check user received full amount (no penalty)
      expect(await stakingToken.balanceOf(user1.address)).to.equal(initialBalance + unstakeAmount);
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("50"));
    });
    
    it("Should apply penalty when unstaking before minimum stake period", async function () {
      const unstakeAmount = ethers.parseEther("50");
      const initialBalance = await stakingToken.balanceOf(user1.address);
      
      // Unstake tokens immediately (before minimum stake period)
      await staking.connect(user1).unstake(unstakeAmount);
      
      // Calculate expected penalty (5%)
      const penaltyRate = await staking.PENALTY_RATE();
      const expectedPenalty = unstakeAmount * penaltyRate / 10000n;
      const expectedReceived = unstakeAmount - expectedPenalty;
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(ethers.parseEther("50")); // 100 - 50
      
      // Check user received amount minus penalty
      expect(await stakingToken.balanceOf(user1.address)).to.equal(initialBalance + expectedReceived);
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("50"));
    });
    
    it("Should fail if trying to unstake more than staked", async function () {
      const excessiveAmount = ethers.parseEther("200"); // User only staked 100
      
      await expect(
        staking.connect(user1).unstake(excessiveAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Claiming Rewards", function () {
    beforeEach(async function () {
      // Stake some tokens first
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });
    
    it("Should allow users to claim rewards based on staked amount", async function () {
      const initialBalance = await rewardToken.balanceOf(user1.address);
      
      // Claim rewards
      await staking.connect(user1).claimReward();
      
      // The amount of rewards should be equal to the user's staked amount
      // This is the default behavior of our mock reward distributor
      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialBalance + ethers.parseEther("100"));
    });
  });

  describe("View Functions", function () {
    it("Should return the total staked amount", async function () {
      expect(await staking.getTotalStaked()).to.equal(0);
      
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
      
      expect(await staking.getTotalStaked()).to.equal(stakeAmount);
    });
  });
}); 