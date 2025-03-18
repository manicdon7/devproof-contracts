const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RewardDistributionOnly", (m) => {
    // Deploy RewardDistribution without constructor arguments
    const rewardDistribution = m.contract("RewardDistribution", []);

    return { rewardDistribution };
}); 