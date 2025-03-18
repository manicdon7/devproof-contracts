const { ethers } = require("hardhat");

async function main() {
  // 1. Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Distributing yield from address:", signer.address);

  // 2. Connect to the deployed YieldPool contract
  const yieldPoolAddress = "0x8BFA062Cba288668D46958288cF0F4B43bC8D92a"; // Replace with your deployed YieldPool address
  const yieldPool = await ethers.getContractAt("YieldPool", yieldPoolAddress, signer);

  // 3. Get the reward token address
  const rewardTokenAddress = await yieldPool.rewardToken();
  console.log("Reward token address:", rewardTokenAddress);
  const rewardToken = await ethers.getContractAt("RewardToken", rewardTokenAddress, signer);

  // 4. Check current yield pool balance
  const totalYieldPool = await yieldPool.totalYieldPool();
  console.log("Current yield pool balance:", ethers.formatEther(totalYieldPool), "tokens");

  // 5. Check reward token balance of signer
  const signerBalance = await rewardToken.balanceOf(signer.address);
  console.log("Your reward token balance:", ethers.formatEther(signerBalance), "tokens");

  // 6. Add yield to the pool (if needed)
  const yieldToAdd = ethers.parseEther("10");
  
  // First approve the YieldPool contract to spend tokens
  console.log("Approving YieldPool to spend tokens...");
  const approveTx = await rewardToken.approve(yieldPoolAddress, yieldToAdd);
  await approveTx.wait();
  console.log("Approval successful, tx hash:", approveTx.hash);
  
  // Add yield to the pool
  console.log(`Adding ${ethers.formatEther(yieldToAdd)} tokens to yield pool...`);
  const addYieldTx = await yieldPool.addYield(yieldToAdd);
  console.log("Waiting for transaction to be mined...");
  const addYieldReceipt = await addYieldTx.wait();
  console.log("Yield added! Transaction hash:", addYieldReceipt.hash);

  // 7. Check updated yield pool balance
  const updatedYieldPool = await yieldPool.totalYieldPool();
  console.log("Updated yield pool balance:", ethers.formatEther(updatedYieldPool), "tokens");

  // 8. Distribute yield to a recipient (using signer's address as the recipient for testing)
  const recipientAddress = signer.address; // Using your own address for testing
  const yieldAmount = ethers.parseEther("10");

  console.log(`Distributing ${ethers.formatEther(yieldAmount)} tokens to ${recipientAddress}...`);
  const distributeTx = await yieldPool.distributeYield(recipientAddress, yieldAmount);
  console.log("Waiting for transaction to be mined...");
  const distributeReceipt = await distributeTx.wait();
  console.log("Yield distributed! Transaction hash:", distributeReceipt.hash);

  // 9. Check final balances
  const finalYieldPool = await yieldPool.totalYieldPool();
  console.log("Final yield pool balance:", ethers.formatEther(finalYieldPool), "tokens");
  
  const recipientBalance = await rewardToken.balanceOf(recipientAddress);
  console.log("Recipient balance:", ethers.formatEther(recipientBalance), "tokens");
}

// Run the script and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  }); 