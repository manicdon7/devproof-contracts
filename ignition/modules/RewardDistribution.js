const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const StakingTokenModule = require("./StakingToken");

module.exports = buildModule("RewardDistribution", (m) => {
    const { stakingToken } = m.useModule(StakingTokenModule);

    // Deploy RewardDistribution with StakingToken as the reward token
    const rewardDistribution = m.contract("RewardDistribution", [stakingToken]);

    return { rewardDistribution };
}); 