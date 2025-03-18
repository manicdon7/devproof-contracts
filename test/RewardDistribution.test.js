const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardDistribution", function () {
  let rewardDistributor;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy reward distributor
    const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
    rewardDistributor = await RewardDistribution.deploy();
    
    // Fund the reward distributor with CORE tokens
    await owner.sendTransaction({
      to: rewardDistributor.target,
      value: ethers.parseEther("10")
    });
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await rewardDistributor.owner()).to.equal(owner.address);
    });

    it("Should have the correct CORE token balance after deployment", async function () {
      expect(await ethers.provider.getBalance(rewardDistributor.target)).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Reward Distribution", function () {
    it("Should distribute rewards correctly to users", async function () {
      const rewardAmount = ethers.parseEther("1");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await rewardDistributor.distributeRewards(user1.address, rewardAmount);
      
      expect(await ethers.provider.getBalance(user1.address)).to.equal(initialBalance + rewardAmount);
      expect(await ethers.provider.getBalance(rewardDistributor.target)).to.equal(ethers.parseEther("9"));
    });

    it("Should revert if the reward amount is zero", async function () {
      await expect(
        rewardDistributor.distributeRewards(user1.address, 0)
      ).to.be.revertedWith("No rewards available");
    });

    it("Should revert if the contract does not have enough tokens to distribute", async function () {
      const excessiveAmount = ethers.parseEther("20"); // More than the contract has
      
      await expect(
        rewardDistributor.distributeRewards(user1.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient reward balance");
    });

    it("Should allow any address to distribute rewards", async function () {
      const rewardAmount = ethers.parseEther("1");
      const initialBalance = await ethers.provider.getBalance(user2.address);
      
      // User1 distributes reward to User2
      await rewardDistributor.connect(user1).distributeRewards(user2.address, rewardAmount);
      
      expect(await ethers.provider.getBalance(user2.address)).to.equal(initialBalance + rewardAmount);
    });
  });
}); 