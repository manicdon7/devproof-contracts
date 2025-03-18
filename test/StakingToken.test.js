const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingToken", function () {
  let stakingToken;
  let owner;
  let user1;
  let user2;
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await stakingToken.name()).to.equal("AmoyStake");
      expect(await stakingToken.symbol()).to.equal("AMYS");
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await stakingToken.balanceOf(owner.address);
      expect(await stakingToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should set the owner correctly", async function () {
      expect(await stakingToken.owner()).to.equal(owner.address);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to user1
      await stakingToken.transfer(user1.address, 50);
      const user1Balance = await stakingToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(50);

      // Transfer 50 tokens from user1 to user2
      await stakingToken.connect(user1).transfer(user2.address, 25);
      const user2Balance = await stakingToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(25);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await stakingToken.balanceOf(owner.address);
      
      // Try to send more tokens than the account has
      await expect(
        stakingToken.connect(user1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(stakingToken, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed
      expect(await stakingToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint new tokens", async function () {
      const initialSupply = await stakingToken.totalSupply();
      const mintAmount = ethers.parseEther("1000");
      
      await stakingToken.mint(user1.address, mintAmount);
      
      expect(await stakingToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await stakingToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should not allow non-owners to mint new tokens", async function () {
      await expect(
        stakingToken.connect(user1).mint(user1.address, 1000)
      ).to.be.revertedWithCustomError(stakingToken, "OwnableUnauthorizedAccount");
    });
  });
}); 