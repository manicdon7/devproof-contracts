const { ethers } = require("hardhat");

async function main() {
  // 1. Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Staking from address:", signer.address);

  // 2. Connect to the deployed Staking contract
  const stakingAddress = "0x665cbba08eF854F342A3E3F4B7470d6B0807943E";
  const staking = await ethers.getContractAt("Staking", stakingAddress, signer);

  // 3. Define the amount to stake (10 tokens, assuming 18 decimals)
  const stakeAmount = ethers.parseEther("10"); // 10 tokens
  console.log("Staking amount:", ethers.formatEther(stakeAmount), "tokens");

  // 4. Check staking token balance (optional, for debugging)
  const stakingTokenAddress = await staking.stakingToken(); // Assumes stakingToken() getter exists
  const stakingToken = await ethers.getContractAt("IERC20", stakingTokenAddress, signer);
  const balance = await stakingToken.balanceOf(signer.address);
  console.log("Staking token balance:", ethers.formatEther(balance), "tokens");

  // 5. Approve the staking contract to spend tokens (if not already approved)
  const allowance = await stakingToken.allowance(signer.address, stakingAddress);
  if (allowance < stakeAmount) {
    console.log("Approving staking contract to spend tokens...");
    const approveTx = await stakingToken.approve(stakingAddress, stakeAmount);
    await approveTx.wait();
    console.log("Approval successful, tx hash:", approveTx.hash);
  } else {
    console.log("Sufficient allowance already exists.");
  }

  // 6. Stake the tokens
  console.log("Staking tokens...");
  const stakeTx = await staking.stake(stakeAmount);
  console.log("Waiting for transaction to be mined...");
  const receipt = await stakeTx.wait();
  console.log("Tokens staked! Transaction hash:", receipt.hash);

  // 7. Verify the stake (optional)
  const userStake = await staking.stakes(signer.address);
  console.log("Staked amount:", ethers.formatEther(userStake.amount), "tokens");
  console.log("Last staked time:", userStake.lastStakedTime.toString());
}

// Run the script and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });