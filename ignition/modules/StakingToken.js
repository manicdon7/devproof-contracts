const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StakingToken", (m) => {
    const stakingToken = m.contract("StakingToken", []);

    return { stakingToken };
}); 