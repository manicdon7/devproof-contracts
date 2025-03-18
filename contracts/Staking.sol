// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IRewardDistribution.sol";
import "./interfaces/IYieldPool.sol";

contract Staking is Ownable, IStaking {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
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
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "Invalid staking token");
        stakingToken = IERC20(_stakingToken);
    }

    function setRewardDistributor(address _rewardDistributor) external onlyOwner {
        rewardDistributor = IRewardDistribution(_rewardDistributor);
    }

    function setYieldPool(address _yieldPool) external onlyOwner {
        yieldPool = IYieldPool(_yieldPool);
    }

    function stake(uint256 amount) external override {
        require(amount > 0, "Cannot stake zero tokens");

        // Transfer tokens to contract
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update staking balance
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].lastStakedTime = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
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

        stakingToken.safeTransfer(msg.sender, withdrawable);

        emit Unstaked(msg.sender, amount, penalty);
    }

    function claimReward() external override {
        rewardDistributor.distributeRewards(msg.sender, stakes[msg.sender].amount);
    }

    function getTotalStaked() external view override returns (uint256) {
        return totalStaked;
    }
}
