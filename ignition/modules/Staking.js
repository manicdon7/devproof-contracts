const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const RewardDistributionModule = require("./RewardDistribution");
const YieldPoolModule = require("./YieldPool");

module.exports = buildModule("Staking", (m) => {
    // Deploy Staking without constructor arguments
    const staking = m.contract("Staking", []);

    // Get other dependent contracts
    const { rewardDistribution } = m.useModule(RewardDistributionModule);
    const { yieldPool } = m.useModule(YieldPoolModule);

    // Set up the staking contract's dependencies
    m.call(staking, "setRewardDistributor", [rewardDistribution]);
    m.call(staking, "setYieldPool", [yieldPool]);

    return { staking };
}); 