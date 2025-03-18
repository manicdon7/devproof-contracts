require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require("hardhat-contract-sizer");
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
         "./ignition/modules/RewardDistribution.js",
         "./ignition/modules/Staking.js",
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
      },
      tcore: {
         url: "https://rpc.test2.btcs.network", // From your coreDaoTestnet in RainbowKitProviderWrapper
         accounts: [process.env.WALLET_PRIVATE_KEY], // Private key from .env
         chainId: 1114, // tCORE testnet chain ID
         gasPrice: 2000000000, // 2 Gwei
         gas: 5000000, // Gas limit
         timeout: 60000, // 60 seconds timeout
       },
   },
   etherscan: {
      apiKey: {
         sepolia: process.env.ETHERSCAN_API_KEY,
         polygonAmoy: process.env.POLYGON_API_KEY,
         tcore: process.env.TCORE_API_KEY
      },
      customChains: [
         {
            network: "tcore",
            chainId: 1114,
            urls: {
               apiURL: "https://scan.test2.btcs.network/api",
               browserURL: "https://scan.test2.btcs.network"
            }
         }
      ]
   },
   paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
   }
};
