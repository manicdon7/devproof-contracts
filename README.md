# Dev-Proof Contracts

## Overview
This project consists of smart contracts for a staking and reward distribution system. It includes separate contracts for:
- **Staking Token**: ERC20 token used for staking.
- **Reward Token**: ERC20 token used for distributing rewards.
- **Staking Contract**: Manages staking, unstaking, and rewards.
- **Reward Distribution Contract**: Handles the allocation of rewards.
- **Yield Pool Contract**: Manages yield rewards for stakers.

## Features
- ERC20-based **staking and reward** system.
- **Penalty mechanism** for early unstaking.
- **Yield-based rewards** for long-term stakers.
- **Secure token transfers** using OpenZeppelin's SafeERC20.
- **Admin-controlled reward settings**.

## Project Structure
```
staking-hardhat/
│── contracts/
│   ├── interfaces/
│   │   ├── IStaking.sol
│   │   ├── IRewardDistribution.sol
│   │   ├── IYieldPool.sol
│   ├── StakingToken.sol
│   ├── RewardToken.sol
│   ├── Staking.sol
│   ├── RewardDistribution.sol
│   ├── YieldPool.sol
│── scripts/
│   ├── deploy.js
│── test/
│── hardhat.config.js
│── .env
│── README.md
```

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/staking-hardhat.git
   cd staking-hardhat
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup
Create a `.env` file and add the following:
```plaintext
AMOY_RPC_URL="https://polygon-amoy.infura.io/v3/YOUR_INFURA_PROJECT_ID"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
POLYGONSCAN_API_KEY="YOUR_POLYGONSCAN_API_KEY"
```

## Compilation
To compile the contracts, run:
```bash
npx hardhat compile
```

## Deployment
To deploy the contracts to the Polygon Amoy testnet, run:
```bash
npx hardhat run scripts/deploy.js --network amoy
```
After deployment, note down the contract addresses.

## Verifying Contracts
To verify contracts on PolygonScan:
```bash
npx hardhat verify --network amoy <DEPLOYED_CONTRACT_ADDRESS>
```

## Interacting with Contracts
Start the Hardhat console:
```bash
npx hardhat console --network amoy
```
Example interaction:
```javascript
const staking = await ethers.getContractAt("Staking", "<STAKING_CONTRACT_ADDRESS>");
await staking.stake(ethers.utils.parseEther("10"));
console.log("Tokens staked!");
```

## Testing
Run the test cases:
```bash
npx hardhat test
```

## License
This project is licensed under the MIT License.

