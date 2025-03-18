const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const RewardTokenModule = require("./RewardToken");

module.exports = buildModule("YieldPool", (m) => {
    // Get the RewardToken deployment
    const { rewardToken } = m.useModule(RewardTokenModule);

    // Deploy YieldPool with RewardToken as the reward token
    const yieldPool = m.contract("YieldPool", [rewardToken]);

    return { yieldPool };
}); 