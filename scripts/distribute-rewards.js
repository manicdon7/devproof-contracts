const { ethers } = require("hardhat");

async function main() {
  // 1. Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Distributing rewards from address:", signer.address);

  // 2. Connect to the deployed RewardDistribution contract
  const rewardDistributorAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed RewardDistribution address
  const rewardDistributor = await ethers.getContractAt("RewardDistribution", rewardDistributorAddress, signer);

  // 3. Get the reward token address
  const rewardTokenAddress = await rewardDistributor.rewardToken();
  console.log("Reward token address:", rewardTokenAddress);
  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenAddress, signer);

  // 4. Check reward token balance of the distributor
  const distributorBalance = await rewardToken.balanceOf(rewardDistributorAddress);
  console.log("Distributor reward token balance:", ethers.formatEther(distributorBalance), "tokens");

  // 5. Transfer some tokens to the distributor if needed
  if (distributorBalance < ethers.parseEther("100")) {
    const transferAmount = ethers.parseEther("1000");
    console.log(`Transferring ${ethers.formatEther(transferAmount)} tokens to the distributor...`);
    
    const transferTx = await rewardToken.transfer(rewardDistributorAddress, transferAmount);
    console.log("Waiting for transaction to be mined...");
    const transferReceipt = await transferTx.wait();
    console.log("Tokens transferred! Transaction hash:", transferReceipt.hash);
    
    // Check updated balance
    const updatedBalance = await rewardToken.balanceOf(rewardDistributorAddress);
    console.log("Updated distributor balance:", ethers.formatEther(updatedBalance), "tokens");
  }

  // 6. Specify the recipient and amount for reward distribution
  const recipientAddress = signer.address; // Using your own address for testing
  const rewardAmount = ethers.parseEther("50");

  // 7. Check recipient's initial balance
  const initialRecipientBalance = await rewardToken.balanceOf(recipientAddress);
  console.log("Initial recipient balance:", ethers.formatEther(initialRecipientBalance), "tokens");

  // 8. Distribute rewards
  console.log(`Distributing ${ethers.formatEther(rewardAmount)} tokens to ${recipientAddress}...`);
  const distributeTx = await rewardDistributor.distributeRewards(recipientAddress, rewardAmount);
  console.log("Waiting for transaction to be mined...");
  const distributeReceipt = await distributeTx.wait();
  console.log("Rewards distributed! Transaction hash:", distributeReceipt.hash);

  // 9. Check final balances
  const finalDistributorBalance = await rewardToken.balanceOf(rewardDistributorAddress);
  console.log("Final distributor balance:", ethers.formatEther(finalDistributorBalance), "tokens");
  
  const finalRecipientBalance = await rewardToken.balanceOf(recipientAddress);
  console.log("Final recipient balance:", ethers.formatEther(finalRecipientBalance), "tokens");
  
  // Verify the correct amount was transferred
  const balanceChange = finalRecipientBalance - initialRecipientBalance;
  console.log("Recipient balance change:", ethers.formatEther(balanceChange), "tokens");
  
  if (balanceChange == rewardAmount) {
    console.log("✅ Reward distribution successful!");
  } else {
    console.log("❌ Reward distribution amount mismatch!");
  }
}

// Run the script and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  }); 