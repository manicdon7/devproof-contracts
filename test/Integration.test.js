const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
  let rewardDistributor;
  let yieldPool;
  let staking;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy contracts
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistributor = await RewardDistribution.deploy();
    
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy();
    
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy();
    
    // Set up contract relationships
    await staking.setRewardDistributor(rewardDistributor.target);
    await staking.setYieldPool(yieldPool.target);
    
    // Fund contracts with CORE tokens
    await owner.sendTransaction({
      to: rewardDistributor.target,
      value: ethers.parseEther("100")
    });
    
    await owner.sendTransaction({
      to: yieldPool.target,
      value: ethers.parseEther("50")
    });
    
    // Update yield pool total
    await yieldPool.addYield({ value: ethers.parseEther("50") });
  });

  describe("End-to-End Staking Flow", function () {
    it("Should allow users to stake, claim rewards, and unstake", async function () {
      // Initial balances
      const initialCoreBalance = await ethers.provider.getBalance(user1.address);
      
      // 1. User stakes CORE tokens
      const stakeAmount = ethers.parseEther("1");
      const stakeTx = await staking.connect(user1).stake({ value: stakeAmount });
      const stakeGasUsed = (await stakeTx.wait()).gasUsed * (await stakeTx.wait()).gasPrice;
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(stakeAmount);
      
      // 2. User claims rewards
      const balanceBeforeClaim = await ethers.provider.getBalance(user1.address);
      const claimTx = await staking.connect(user1).claimReward();
      const claimGasUsed = (await claimTx.wait()).gasUsed * (await claimTx.wait()).gasPrice;
      
      // Check user's balance increased (should have received rewards equal to staked amount)
      const expectedBalanceAfterClaim = balanceBeforeClaim + stakeAmount - claimGasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalanceAfterClaim,
        ethers.parseEther("0.01")
      );
      
      // 3. Fast forward past minimum stake period
      const minStakePeriod = await staking.MIN_STAKE_PERIOD();
      await ethers.provider.send("evm_increaseTime", [minStakePeriod.toString()]);
      await ethers.provider.send("evm_mine");
      
      // 4. User unstakes tokens (no penalty)
      const balanceBeforeUnstake = await ethers.provider.getBalance(user1.address);
      const unstakeTx = await staking.connect(user1).unstake(stakeAmount);
      const unstakeGasUsed = (await unstakeTx.wait()).gasUsed * (await unstakeTx.wait()).gasPrice;
      
      // Check final balance (should get back full stake amount)
      const expectedFinalBalance = balanceBeforeUnstake + stakeAmount - unstakeGasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedFinalBalance,
        ethers.parseEther("0.01")
      );
      
      // Check user's stake is zero
      const finalStake = await staking.stakes(user1.address);
      expect(finalStake.amount).to.equal(0);
    });
  });

  describe("Reward Distribution Integration", function () {
    it("Should distribute rewards from RewardDistributor when claiming", async function () {
      const stakeAmount = ethers.parseEther("2");
      const initialDistributorBalance = await ethers.provider.getBalance(rewardDistributor.target);
      
      // Stake tokens
      await staking.connect(user1).stake({ value: stakeAmount });
      
      // Claim rewards
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      const claimTx = await staking.connect(user1).claimReward();
      const claimGasUsed = (await claimTx.wait()).gasUsed * (await claimTx.wait()).gasPrice;
      
      // Check user received rewards
      const expectedBalance = initialUserBalance + stakeAmount - claimGasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.01")
      );
      
      // Check distributor balance decreased
      expect(await ethers.provider.getBalance(rewardDistributor.target)).to.equal(
        initialDistributorBalance - stakeAmount
      );
    });
  });

  describe("Early Unstaking Penalty", function () {
    it("Should apply penalty when unstaking early", async function () {
      const stakeAmount = ethers.parseEther("5");
      
      // Stake tokens
      await staking.connect(user1).stake({ value: stakeAmount });
      
      // Initial balance before unstaking
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Unstake immediately (before minimum stake period)
      const unstakeTx = await staking.connect(user1).unstake(stakeAmount);
      const unstakeGasUsed = (await unstakeTx.wait()).gasUsed * (await unstakeTx.wait()).gasPrice;
      
      // Calculate expected penalty (5%)
      const penaltyRate = await staking.PENALTY_RATE();
      const expectedPenalty = stakeAmount * penaltyRate / 10000n;
      const expectedReceived = stakeAmount - expectedPenalty;
      
      // Check that user received stake amount minus penalty
      const expectedBalance = initialBalance + expectedReceived - unstakeGasUsed;
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Yield Distribution", function () {
    it("Should allow yield pool to distribute yield to users", async function () {
      const yieldAmount = ethers.parseEther("1");
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      const initialYieldPoolBalance = await yieldPool.totalYieldPool();
      
      // Distribute yield to user
      await yieldPool.distributeYield(user1.address, yieldAmount);
      
      // Check user received yield
      expect(await ethers.provider.getBalance(user1.address)).to.equal(
        initialUserBalance + yieldAmount
      );
      
      // Check yield pool balance decreased
      expect(await yieldPool.totalYieldPool()).to.equal(
        initialYieldPoolBalance - yieldAmount
      );
    });
  });

  describe("Multiple Users Staking", function () {
    it("Should correctly handle multiple users staking and claiming", async function () {
      // User 1 stakes
      const stakeAmount1 = ethers.parseEther("1");
      await staking.connect(user1).stake({ value: stakeAmount1 });
      
      // User 2 stakes
      const stakeAmount2 = ethers.parseEther("2");
      await staking.connect(user2).stake({ value: stakeAmount2 });
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(stakeAmount1 + stakeAmount2);
      
      // User 1 claims rewards
      const initialUser1Balance = await ethers.provider.getBalance(user1.address);
      const claim1Tx = await staking.connect(user1).claimReward();
      const claim1GasUsed = (await claim1Tx.wait()).gasUsed * (await claim1Tx.wait()).gasPrice;
      
      // User 2 claims rewards
      const initialUser2Balance = await ethers.provider.getBalance(user2.address);
      const claim2Tx = await staking.connect(user2).claimReward();
      const claim2GasUsed = (await claim2Tx.wait()).gasUsed * (await claim2Tx.wait()).gasPrice;
      
      // Check users received rewards proportional to their stakes
      expect(await ethers.provider.getBalance(user1.address)).to.be.closeTo(
        initialUser1Balance + stakeAmount1 - claim1GasUsed,
        ethers.parseEther("0.01")
      );
      
      expect(await ethers.provider.getBalance(user2.address)).to.be.closeTo(
        initialUser2Balance + stakeAmount2 - claim2GasUsed,
        ethers.parseEther("0.01")
      );
    });
  });
}); 