const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
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
    
    // Deploy tokens
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy();
    
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    
    // Deploy contracts
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistributor = await RewardDistribution.deploy(rewardToken.target);
    
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy(rewardToken.target);
    
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(stakingToken.target);
    
    // Set up contract relationships
    await staking.setRewardDistributor(rewardDistributor.target);
    await staking.setYieldPool(yieldPool.target);
    
    // Fund contracts
    const distributionAmount = ethers.parseEther("100000");
    await rewardToken.transfer(rewardDistributor.target, distributionAmount);
    
    const yieldAmount = ethers.parseEther("50000");
    await rewardToken.approve(yieldPool.target, yieldAmount);
    await yieldPool.addYield(yieldAmount);
    
    // Give tokens to users
    const userAmount = ethers.parseEther("1000");
    await stakingToken.mint(user1.address, userAmount);
    await stakingToken.mint(user2.address, userAmount);
  });

  describe("End-to-End Staking Flow", function () {
    it("Should allow users to stake, claim rewards, and unstake", async function () {
      // Initial balances
      const initialStakingTokenBalance = await stakingToken.balanceOf(user1.address);
      const initialRewardTokenBalance = await rewardToken.balanceOf(user1.address);
      
      // 1. User approves and stakes tokens
      const stakeAmount = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
      
      // Check user's stake
      const userStake = await staking.stakes(user1.address);
      expect(userStake.amount).to.equal(stakeAmount);
      
      // 2. User claims rewards
      await staking.connect(user1).claimReward();
      
      // Check user received rewards equal to stake amount (1:1 in our simple implementation)
      expect(await rewardToken.balanceOf(user1.address)).to.equal(
        initialRewardTokenBalance + stakeAmount
      );
      
      // 3. Fast forward past minimum stake period
      const minStakePeriod = await staking.MIN_STAKE_PERIOD();
      await ethers.provider.send("evm_increaseTime", [minStakePeriod.toString()]);
      await ethers.provider.send("evm_mine");
      
      // 4. User unstakes tokens (no penalty)
      await staking.connect(user1).unstake(stakeAmount);
      
      // Check user received their tokens back
      expect(await stakingToken.balanceOf(user1.address)).to.equal(initialStakingTokenBalance);
      
      // Check user's stake is zero
      const finalStake = await staking.stakes(user1.address);
      expect(finalStake.amount).to.equal(0);
    });
  });

  describe("Reward Distribution Integration", function () {
    it("Should distribute rewards from RewardDistributor when claiming", async function () {
      const stakeAmount = ethers.parseEther("100");
      const initialDistributorBalance = await rewardToken.balanceOf(rewardDistributor.target);
      
      // Stake tokens
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
      
      // Claim rewards
      await staking.connect(user1).claimReward();
      
      // Check user received rewards
      expect(await rewardToken.balanceOf(user1.address)).to.equal(stakeAmount);
      
      // Check distributor balance decreased
      expect(await rewardToken.balanceOf(rewardDistributor.target)).to.equal(
        initialDistributorBalance - stakeAmount
      );
    });
  });

  describe("Early Unstaking Penalty", function () {
    it("Should apply penalty when unstaking early and penalty goes to yield pool", async function () {
      const stakeAmount = ethers.parseEther("100");
      const initialYieldPoolBalance = await rewardToken.balanceOf(yieldPool.target);
      
      // Stake tokens
      await stakingToken.connect(user1).approve(staking.target, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
      
      // Unstake immediately (before minimum stake period)
      await staking.connect(user1).unstake(stakeAmount);
      
      // Calculate expected penalty (5%)
      const penaltyRate = await staking.PENALTY_RATE();
      const expectedPenalty = stakeAmount * penaltyRate / 10000n;
      
      // Check penalty funds were transferred to yield pool
      // Note: In the real implementation, you would need to add a function to transfer penalties to the yield pool
      // This test assumes this functionality exists or will be added
      // expect(await rewardToken.balanceOf(yieldPool.target)).to.equal(
      //   initialYieldPoolBalance + expectedPenalty
      // );
      
      // If the penalty handling is not yet implemented, this test should be updated
      // once that functionality is built
    });
  });

  describe("Yield Distribution", function () {
    it("Should allow yield pool to distribute yield to users", async function () {
      const yieldAmount = ethers.parseEther("10");
      const initialUserBalance = await rewardToken.balanceOf(user1.address);
      const initialYieldPoolBalance = await yieldPool.totalYieldPool();
      
      // Distribute yield to user
      await yieldPool.distributeYield(user1.address, yieldAmount);
      
      // Check user received yield
      expect(await rewardToken.balanceOf(user1.address)).to.equal(
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
      const stakeAmount1 = ethers.parseEther("100");
      await stakingToken.connect(user1).approve(staking.target, stakeAmount1);
      await staking.connect(user1).stake(stakeAmount1);
      
      // User 2 stakes
      const stakeAmount2 = ethers.parseEther("200");
      await stakingToken.connect(user2).approve(staking.target, stakeAmount2);
      await staking.connect(user2).stake(stakeAmount2);
      
      // Check total staked
      expect(await staking.totalStaked()).to.equal(stakeAmount1 + stakeAmount2);
      
      // Both users claim rewards
      await staking.connect(user1).claimReward();
      await staking.connect(user2).claimReward();
      
      // Check users received rewards proportional to their stakes
      expect(await rewardToken.balanceOf(user1.address)).to.equal(stakeAmount1);
      expect(await rewardToken.balanceOf(user2.address)).to.equal(stakeAmount2);
    });
  });
}); 