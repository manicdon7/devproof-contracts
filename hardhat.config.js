require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
   solidity: {
      version: "0.8.28",
      settings: {
         optimizer: {
            enabled: true,
            runs: 200
         }
      }
   },
   ignition: {
      modules: [
         "./ignition/modules/StakingToken.js",
         "./ignition/modules/RewardDistribution.js",
         "./ignition/modules/Staking.js",
         "./ignition/modules/RewardToken.js",
         "./ignition/modules/YieldPool.js",
      ]
   },
   networks: {
      // localhost: {
      //    url: "http://127.0.0.1:8545/",
      //    chainId: 31337
      // },
      amoy: {
         url: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
         accounts: [process.env.WALLET_PRIVATE_KEY],
         chainId: 80002,
         gasPrice: "auto",
         timeout: 60000
      }
   },
   etherscan: {
      apiKey: {
         sepolia: process.env.ETHERSCAN_API_KEY,
         polygonAmoy: process.env.POLYGON_API_KEY
      },
   },
   paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
   }
};
