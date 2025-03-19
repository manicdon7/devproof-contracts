const { ethers } = require("hardhat");

async function main() {
  try {
    // 1. Get the signer (your wallet)
    const [signer] = await ethers.getSigners();
    console.log("Unstaking from address:", signer.address);

    // 2. Connect to the deployed Staking contract
    const stakingAddress = "0x8f90426F741B7CbF71954048Fe1c975749B17f3c"; // Updated tCORE address
    console.log("Connecting to Staking contract at:", stakingAddress);
    
    const staking = await ethers.getContractAt("Staking", stakingAddress, signer);
    
    // Verify contract connection
    try {
      await staking.getTotalStaked();
      console.log("Successfully connected to Staking contract");
    } catch (error) {
      console.error("Failed to connect to Staking contract. Please verify the contract address.");
      return;
    }

    // 3. Get current stake information
    console.log("Fetching stake information...");
    const userStake = await staking.stakes(signer.address);
    console.log("Current staked amount:", ethers.formatEther(userStake.amount), "tokens");
    
    // Safely convert BigInt to Number for Date constructor
    const timestamp = Number(userStake.lastStakedTime);
    console.log("Last staked time:", new Date(timestamp * 1000).toLocaleString());

    // Check if user has any stakes
    if (userStake.amount === 0n) {
      console.log("No tokens staked. Nothing to unstake.");
      return;
    }

    // 4. Define the amount to unstake (all tokens)
    const unstakeAmount = userStake.amount;
    console.log("Unstaking amount:", ethers.formatEther(unstakeAmount), "tokens");

    // 5. Check if minimum stake period has passed
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceStake = currentTime - Number(userStake.lastStakedTime);
    const minStakePeriod = Number(await staking.MIN_STAKE_PERIOD());
    
    if (timeSinceStake < minStakePeriod) {
      console.log("Warning: Minimum stake period not met. A penalty will be applied.");
      const penaltyRate = await staking.PENALTY_RATE();
      const penalty = (unstakeAmount * penaltyRate) / 10000n;
      console.log("Expected penalty:", ethers.formatEther(penalty), "tokens");
      
      // Calculate days until penalty-free unstaking
      const daysLeft = Math.ceil((minStakePeriod - timeSinceStake) / 86400);
      console.log(`You need to wait ${daysLeft} more day(s) for penalty-free unstaking.`);
    }

    // 6. Unstake the tokens
    console.log("Unstaking tokens...");
    const unstakeTx = await staking.unstake(unstakeAmount);
    console.log("Transaction sent. Hash:", unstakeTx.hash);
    console.log("Waiting for transaction to be mined...");
    const receipt = await unstakeTx.wait();
    console.log("Tokens unstaked! Transaction hash:", receipt.hash);

    // 7. Verify the unstake
    const updatedStake = await staking.stakes(signer.address);
    console.log("Remaining staked amount:", ethers.formatEther(updatedStake.amount), "tokens");
  } catch (error) {
    console.error("Error during unstaking:", error);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

// Run the script and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  }); 