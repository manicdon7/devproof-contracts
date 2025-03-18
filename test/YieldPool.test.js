const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldPool", function () {
  let yieldPool;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy yield pool contract
    const YieldPool = await ethers.getContractFactory("YieldPool");
    yieldPool = await YieldPool.deploy();
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await yieldPool.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total yield pool", async function () {
      expect(await yieldPool.totalYieldPool()).to.equal(0);
    });
  });

  describe("Adding Yield", function () {
    it("Should allow owner to add yield to the pool", async function () {
      const yieldAmount = ethers.parseEther("10");
      
      await yieldPool.addYield({ value: yieldAmount });
      
      expect(await yieldPool.totalYieldPool()).to.equal(yieldAmount);
      expect(await ethers.provider.getBalance(yieldPool.target)).to.equal(yieldAmount);
    });

    it("Should not allow non-owners to add yield", async function () {
      const yieldAmount = ethers.parseEther("10");
      
      await expect(
        yieldPool.connect(user1).addYield({ value: yieldAmount })
      ).to.be.revertedWithCustomError(yieldPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Distributing Yield", function () {
    beforeEach(async function () {
      // Add some yield to the pool first
      const yieldAmount = ethers.parseEther("10");
      await yieldPool.addYield({ value: yieldAmount });
    });

    it("Should distribute yield correctly", async function () {
      const distributionAmount = ethers.parseEther("1");
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      const initialPoolBalance = await yieldPool.totalYieldPool();
      
      const tx = await yieldPool.distributeYield(user1.address, distributionAmount);
      
      expect(await ethers.provider.getBalance(user1.address)).to.equal(initialUserBalance + distributionAmount);
      expect(await yieldPool.totalYieldPool()).to.equal(initialPoolBalance - distributionAmount);
    });

    it("Should revert if the distribution amount is zero", async function () {
      await expect(
        yieldPool.distributeYield(user1.address, 0)
      ).to.be.revertedWith("Invalid yield amount");
    });

    it("Should revert if the distribution amount exceeds the pool balance", async function () {
      const excessiveAmount = ethers.parseEther("20"); // More than the pool has
      
      await expect(
        yieldPool.distributeYield(user1.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient pool balance");
    });

    it("Should allow any address to distribute yield", async function () {
      // Even user1 should be able to call the distributeYield function
      const distributionAmount = ethers.parseEther("1");
      const initialUser2Balance = await ethers.provider.getBalance(user2.address);
      
      // User1 distributes to User2
      await yieldPool.connect(user1).distributeYield(user2.address, distributionAmount);
      
      expect(await ethers.provider.getBalance(user2.address)).to.equal(initialUser2Balance + distributionAmount);
    });
  });
}); 