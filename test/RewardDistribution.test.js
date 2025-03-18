const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardDistribution", function () {
  let rewardToken;
  let rewardDistribution;
  let owner;
  let user1;
  let user2;
  let initialRewardSupply;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy reward token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    initialRewardSupply = ethers.parseEther("1000000");
    
    // Deploy reward distribution contract
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistribution = await RewardDistribution.deploy(rewardToken.target);
    
    // Transfer some tokens to the reward distribution contract
    const distributionAmount = ethers.parseEther("100000");
    await rewardToken.transfer(rewardDistribution.target, distributionAmount);
  });

  describe("Deployment", function () {
    it("Should set the reward token correctly", async function () {
      expect(await rewardDistribution.rewardToken()).to.equal(rewardToken.target);
    });

    it("Should set the owner correctly", async function () {
      expect(await rewardDistribution.owner()).to.equal(owner.address);
    });

    it("Should have the correct token balance", async function () {
      const distributionAmount = ethers.parseEther("100000");
      expect(await rewardToken.balanceOf(rewardDistribution.target)).to.equal(distributionAmount);
    });
  });

  describe("Reward Distribution", function () {
    it("Should distribute rewards correctly", async function () {
      const rewardAmount = ethers.parseEther("1000");
      const initialUserBalance = await rewardToken.balanceOf(user1.address);
      const initialContractBalance = await rewardToken.balanceOf(rewardDistribution.target);
      
      await rewardDistribution.distributeRewards(user1.address, rewardAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialUserBalance + rewardAmount);
      expect(await rewardToken.balanceOf(rewardDistribution.target)).to.equal(initialContractBalance - rewardAmount);
    });

    it("Should revert if reward amount is zero", async function () {
      await expect(
        rewardDistribution.distributeRewards(user1.address, 0)
      ).to.be.revertedWith("No rewards available");
    });

    it("Should revert if the contract doesn't have enough tokens", async function () {
      const excessiveAmount = ethers.parseEther("1000000"); // More than the contract has
      
      await expect(
        rewardDistribution.distributeRewards(user1.address, excessiveAmount)
      ).to.be.reverted; // ERC20: transfer amount exceeds balance
    });
  });

  describe("Access Control", function () {
    it("Should allow any address to distribute rewards", async function () {
      // Even user1 should be able to call the distributeRewards function
      const rewardAmount = ethers.parseEther("1000");
      
      await rewardDistribution.connect(user1).distributeRewards(user2.address, rewardAmount);
      
      expect(await rewardToken.balanceOf(user2.address)).to.equal(rewardAmount);
    });
  });
}); 