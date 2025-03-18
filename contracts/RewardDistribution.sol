// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRewardDistribution.sol";

contract RewardDistribution is Ownable, IRewardDistribution {
    IERC20 public immutable rewardToken;

    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Invalid reward token");
        rewardToken = IERC20(_rewardToken);
    }

    function distributeRewards(address user, uint256 amount) external override {
        require(amount > 0, "No rewards available");
        rewardToken.transfer(user, amount);
    }
}
