const { run } = require("hardhat");

async function main() {
  console.log("Starting contract verification...");

  // Contract addresses from deployment
  const REWARD_DISTRIBUTION_ADDRESS = "0x9B9446e6d0CDcf773d74E954F4cD61ee213aAc17";
  const YIELD_POOL_ADDRESS = "0xA87e632f680A458b9eFb319a2448bC45E6C52117";
  const STAKING_ADDRESS = "0x8f90426F741B7CbF71954048Fe1c975749B17f3c";

  try {
    // Verify RewardDistribution
    console.log("Verifying RewardDistribution...");
    await run("verify:verify", {
      address: REWARD_DISTRIBUTION_ADDRESS,
      constructorArguments: [], // No constructor arguments
    });
    console.log("RewardDistribution verified successfully");

    // Verify YieldPool
    console.log("Verifying YieldPool...");
    await run("verify:verify", {
      address: YIELD_POOL_ADDRESS,
      constructorArguments: [], // No constructor arguments
    });
    console.log("YieldPool verified successfully");

    // Verify Staking
    console.log("Verifying Staking...");
    await run("verify:verify", {
      address: STAKING_ADDRESS,
      constructorArguments: [], // No constructor arguments
    });
    console.log("Staking verified successfully");

    console.log("All contracts verified successfully!");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 