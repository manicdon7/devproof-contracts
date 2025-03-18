const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const StakingTokenModule = require("./StakingToken");
const RewardDistributionModule = require("./RewardDistribution");
const YieldPoolModule = require("./YieldPool");

module.exports = buildModule("Staking", (m) => {
    // Get the StakingToken deployment
    const { stakingToken } = m.useModule(StakingTokenModule);

    // Deploy Staking with StakingToken
    const staking = m.contract("Staking", [stakingToken]);

    // Get other dependent contracts
    const { rewardDistribution } = m.useModule(RewardDistributionModule);
    const { yieldPool } = m.useModule(YieldPoolModule);

    // Set up the staking contract's dependencies
    m.call(staking, "setRewardDistributor", [rewardDistribution]);
    m.call(staking, "setYieldPool", [yieldPool]);

    return { staking };
}); 