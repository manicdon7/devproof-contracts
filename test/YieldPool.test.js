const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldPool", function () {
  let rewardToken;
  let yieldPool;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy reward token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    
    // Deploy yield pool contract
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy(rewardToken.target);
    
    // Approve yield pool to spend owner's tokens
    const approvalAmount = ethers.parseEther("1000000");
    await rewardToken.approve(yieldPool.target, approvalAmount);
  });

  describe("Deployment", function () {
    it("Should set the reward token correctly", async function () {
      expect(await yieldPool.rewardToken()).to.equal(rewardToken.target);
    });

    it("Should set the owner correctly", async function () {
      expect(await yieldPool.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total yield pool", async function () {
      expect(await yieldPool.totalYieldPool()).to.equal(0);
    });
  });

  describe("Adding Yield", function () {
    it("Should allow owner to add yield to the pool", async function () {
      const yieldAmount = ethers.parseEther("10000");
      
      await yieldPool.addYield(yieldAmount);
      
      expect(await yieldPool.totalYieldPool()).to.equal(yieldAmount);
      expect(await rewardToken.balanceOf(yieldPool.target)).to.equal(yieldAmount);
    });

    it("Should not allow non-owners to add yield", async function () {
      const yieldAmount = ethers.parseEther("10000");
      
      await expect(
        yieldPool.connect(user1).addYield(yieldAmount)
      ).to.be.revertedWithCustomError(yieldPool, "OwnableUnauthorizedAccount");
    });

    it("Should fail if allowance is insufficient", async function () {
      // First use up all allowance
      const maxAmount = ethers.parseEther("1000000");
      await yieldPool.addYield(maxAmount);
      
      // Try to add more yield without approving more tokens
      await expect(
        yieldPool.addYield(1)
      ).to.be.reverted; // ERC20: insufficient allowance
    });
  });

  describe("Distributing Yield", function () {
    beforeEach(async function () {
      // Add some yield to the pool first
      const yieldAmount = ethers.parseEther("10000");
      await yieldPool.addYield(yieldAmount);
    });

    it("Should distribute yield correctly", async function () {
      const distributionAmount = ethers.parseEther("1000");
      const initialUserBalance = await rewardToken.balanceOf(user1.address);
      const initialPoolBalance = await yieldPool.totalYieldPool();
      
      await yieldPool.distributeYield(user1.address, distributionAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(initialUserBalance + distributionAmount);
      expect(await yieldPool.totalYieldPool()).to.equal(initialPoolBalance - distributionAmount);
    });

    it("Should revert if the distribution amount is zero", async function () {
      await expect(
        yieldPool.distributeYield(user1.address, 0)
      ).to.be.revertedWith("Invalid yield amount");
    });

    it("Should revert if the distribution amount exceeds the pool balance", async function () {
      const excessiveAmount = ethers.parseEther("20000"); // More than the pool has
      
      await expect(
        yieldPool.distributeYield(user1.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient pool balance");
    });

    it("Should allow any address to distribute yield", async function () {
      // Even user1 should be able to call the distributeYield function
      const distributionAmount = ethers.parseEther("1000");
      
      await yieldPool.connect(user1).distributeYield(user2.address, distributionAmount);
      
      expect(await rewardToken.balanceOf(user2.address)).to.equal(distributionAmount);
    });
  });
}); 