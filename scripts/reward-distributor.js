const { ethers } = require("hardhat");

async function main() {
  try {
    // 1. Get the signer (your wallet)
    const [signer] = await ethers.getSigners();
    console.log("Managing rewards from address:", signer.address);

    // 2. Connect to the deployed Staking and RewardDistribution contracts
    const stakingAddress = "0x8f90426F741B7CbF71954048Fe1c975749B17f3c";
    const rewardDistributorAddress = "0x9B9446e6d0CDcf773d74E954F4cD61ee213aAc17";
    
    console.log("Connecting to Staking contract at:", stakingAddress);
    console.log("Connecting to RewardDistribution contract at:", rewardDistributorAddress);
    
    const staking = await ethers.getContractAt("Staking", stakingAddress, signer);
    const rewardDistributor = await ethers.getContractAt("RewardDistribution", rewardDistributorAddress, signer);
    
    // Verify contract connections
    try {
      await staking.getTotalStaked();
      console.log("Successfully connected to Staking contract");
    } catch (error) {
      console.error("Failed to connect to Staking contract. Please verify the contract address.");
      return;
    }

    // 3. Check the RewardDistribution contract balance
    const rewardBalance = await ethers.provider.getBalance(rewardDistributorAddress);
    console.log("RewardDistribution contract balance:", ethers.formatEther(rewardBalance), "tCORE");

    // 4. Fund the RewardDistribution contract (if needed)
    const fundAmount = ethers.parseEther("0.05"); // 0.05 tCORE
    
    if (rewardBalance < fundAmount) {
      console.log(`RewardDistribution contract balance is low. Funding with ${ethers.formatEther(fundAmount)} tCORE...`);
      
      const fundTx = await signer.sendTransaction({
        to: rewardDistributorAddress,
        value: fundAmount
      });
      console.log("Funding transaction sent. Hash:", fundTx.hash);
      await fundTx.wait();
      console.log("RewardDistribution contract funded successfully!");
      
      const newBalance = await ethers.provider.getBalance(rewardDistributorAddress);
      console.log("Updated RewardDistribution contract balance:", ethers.formatEther(newBalance), "tCORE");
    } else {
      console.log("RewardDistribution contract has sufficient balance. No funding needed.");
    }

    // 5. Get user staking information
    const userAddress = process.argv[2] || signer.address; // Default to signer if no address provided
    console.log("Checking stake for address:", userAddress);
    
    const userStake = await staking.stakes(userAddress);
    console.log("User staked amount:", ethers.formatEther(userStake.amount), "tCORE");
    
    if (userStake.amount === 0n) {
      console.log("User has no staked tokens. Cannot distribute rewards.");
      return;
    }

    // 6. Calculate reward amount (5% of staked amount for demonstration)
    const rewardPercent = 5; // 5%
    const rewardAmount = (userStake.amount * BigInt(rewardPercent)) / 100n;
    console.log("Calculated reward amount:", ethers.formatEther(rewardAmount), "tCORE");

    if (rewardAmount > rewardBalance) {
      console.log("Warning: Reward amount exceeds contract balance. Please fund the contract more.");
      return;
    }

    // 7. Distribute rewards
    console.log("Distributing rewards to user...");
    const distributeTx = await rewardDistributor.distributeRewards(userAddress, rewardAmount);
    console.log("Transaction sent. Hash:", distributeTx.hash);
    console.log("Waiting for transaction to be mined...");
    const receipt = await distributeTx.wait();
    console.log("Rewards distributed! Transaction hash:", receipt.hash);

    // 8. Check the updated RewardDistribution contract balance
    const updatedBalance = await ethers.provider.getBalance(rewardDistributorAddress);
    console.log("Updated RewardDistribution contract balance:", ethers.formatEther(updatedBalance), "tCORE");

    // 9. Check if user has claimed rewards through the staking contract
    console.log("User can also claim rewards directly through the Staking contract using the claimReward function.");

  } catch (error) {
    console.error("Error during reward distribution:", error);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.code) console.error("Error code:", error.code);
  }
}

// Run the script and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  }); 