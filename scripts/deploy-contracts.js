const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy RewardDistribution
  console.log("Deploying RewardDistribution...");
  const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
  const rewardDistribution = await RewardDistribution.deploy();
  await rewardDistribution.waitForDeployment();
  console.log("RewardDistribution deployed to:", rewardDistribution.target);

  // Deploy YieldPool
  console.log("Deploying YieldPool...");
  const YieldPool = await ethers.getContractFactory("YieldPool");
  const yieldPool = await YieldPool.deploy();
  await yieldPool.waitForDeployment();
  console.log("YieldPool deployed to:", yieldPool.target);

  // Deploy Staking
  console.log("Deploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy();
  await staking.waitForDeployment();
  console.log("Staking deployed to:", staking.target);

  // Configure Staking contract dependencies
  console.log("Configuring Staking contract dependencies...");
  await staking.setRewardDistributor(rewardDistribution.target);
  await staking.setYieldPool(yieldPool.target);
  console.log("Staking contract configured with dependencies");

  // Fund contracts (optional)
  console.log("Funding contracts (optional)...");
  // You can send funds to the contracts here if needed

  console.log("All contracts deployed successfully!");
  console.log({
    rewardDistribution: rewardDistribution.target,
    yieldPool: yieldPool.target,
    staking: staking.target
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  }); 