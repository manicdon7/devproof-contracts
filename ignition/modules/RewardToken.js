const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RewardToken", (m) => {
    const rewardToken = m.contract("RewardToken", []);

    return { rewardToken };
}); 