const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("YieldPool", (m) => {
    // Deploy YieldPool without constructor arguments
    const yieldPool = m.contract("YieldPool", []);

    return { yieldPool };
}); 