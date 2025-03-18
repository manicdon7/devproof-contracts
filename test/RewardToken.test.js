const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardToken", function () {
  let rewardToken;
  let owner;
  let user1;
  let user2;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await rewardToken.name()).to.equal("AmoyReward");
      expect(await rewardToken.symbol()).to.equal("AMYR");
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await rewardToken.balanceOf(owner.address);
      expect(await rewardToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should set the owner correctly", async function () {
      expect(await rewardToken.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");
      // Transfer 50 tokens from owner to user1
      await rewardToken.transfer(user1.address, transferAmount);
      const user1Balance = await rewardToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(transferAmount);

      const smallerTransfer = ethers.parseEther("25");
      // Transfer 25 tokens from user1 to user2
      await rewardToken.connect(user1).transfer(user2.address, smallerTransfer);
      const user2Balance = await rewardToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(smallerTransfer);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await rewardToken.balanceOf(owner.address);
      
      // Try to send more tokens than the account has
      await expect(
        rewardToken.connect(user1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(rewardToken, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed
      expect(await rewardToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint new tokens", async function () {
      const initialSupply = await rewardToken.totalSupply();
      const mintAmount = ethers.parseEther("1000");
      
      await rewardToken.mint(user1.address, mintAmount);
      
      expect(await rewardToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await rewardToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should not allow non-owners to mint new tokens", async function () {
      await expect(
        rewardToken.connect(user1).mint(user1.address, 1000)
      ).to.be.revertedWithCustomError(rewardToken, "OwnableUnauthorizedAccount");
    });
  });
}); 