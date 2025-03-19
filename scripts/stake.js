const { ethers } = require("hardhat");

async function main() {
  try {
    // 1. Get the signer (your wallet)
    const [signer] = await ethers.getSigners();
    console.log("Staking from address:", signer.address);

    // 2. Connect to the deployed Staking contract
    const stakingAddress = "0x8f90426F741B7CbF71954048Fe1c975749B17f3c"; // Updated tCORE address
    const staking = await ethers.getContractAt("Staking", stakingAddress, signer);

    // 3. Define the amount to stake (0.1 tCORE)
    const stakeAmount = ethers.parseEther("0.1"); // 0.1 tokens
    console.log("Staking amount:", ethers.formatEther(stakeAmount), "tokens");

    // 4. Check balance before staking
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Account balance:", ethers.formatEther(balance), "tokens");

    if (balance < stakeAmount) {
      console.error("Not enough balance to stake!");
      return;
    }

    // 5. Stake the tokens
    console.log("Staking tokens...");
    const stakeTx = await staking.stake({ value: stakeAmount });
    console.log("Transaction sent. Hash:", stakeTx.hash);
    console.log("Waiting for transaction to be mined...");
    const receipt = await stakeTx.wait();
    console.log("Tokens staked! Transaction hash:", receipt.hash);

    // 6. Verify the stake
    const userStake = await staking.stakes(signer.address);
    console.log("Staked amount:", ethers.formatEther(userStake.amount), "tokens");
    
    // Safely convert BigInt to Number for Date constructor
    const timestamp = Number(userStake.lastStakedTime);
    console.log("Last staked time:", new Date(timestamp * 1000).toLocaleString());
    
  } catch (error) {
    console.error("Error during staking:", error);
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