// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IRewardDistribution.sol";
import "./interfaces/IYieldPool.sol";

contract Staking is Ownable, IStaking {
    IRewardDistribution public rewardDistributor;
    IYieldPool public yieldPool;

    struct StakeInfo {
        uint256 amount;
        uint256 lastStakedTime;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;

    uint256 public constant MIN_STAKE_PERIOD = 7 days;
    uint256 public constant PENALTY_RATE = 500; // 5% penalty

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty);

    constructor() Ownable(msg.sender) {}

    function setRewardDistributor(address _rewardDistributor) external onlyOwner {
        rewardDistributor = IRewardDistribution(_rewardDistributor);
    }

    function setYieldPool(address _yieldPool) external onlyOwner {
        yieldPool = IYieldPool(_yieldPool);
    }

    function stake() external payable override {
        require(msg.value > 0, "Cannot stake zero CORE tokens");

        // Update staking balance
        stakes[msg.sender].amount += msg.value;
        stakes[msg.sender].lastStakedTime = block.timestamp;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external override {
        require(stakes[msg.sender].amount >= amount, "Insufficient balance");

        uint256 penalty = 0;
        if (block.timestamp < stakes[msg.sender].lastStakedTime + MIN_STAKE_PERIOD) {
            penalty = (amount * PENALTY_RATE) / 10000;
        }

        uint256 withdrawable = amount - penalty;

        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;

        // Send CORE tokens back to user
        (bool sent, ) = payable(msg.sender).call{value: withdrawable}("");
        require(sent, "Failed to send CORE tokens");

        emit Unstaked(msg.sender, amount, penalty);
    }

    function claimReward() external override {
        rewardDistributor.distributeRewards(msg.sender, stakes[msg.sender].amount);
    }

    function getTotalStaked() external view override returns (uint256) {
        return totalStaked;
    }

    // Fallback function to receive CORE tokens
    receive() external payable {}
}
