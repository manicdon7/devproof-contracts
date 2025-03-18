// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IYieldPool.sol";

contract YieldPool is Ownable, IYieldPool {
    IERC20 public immutable rewardToken;
    uint256 public totalYieldPool;

    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Invalid reward token");
        rewardToken = IERC20(_rewardToken);
    }

    function addYield(uint256 amount) external onlyOwner {
        rewardToken.transferFrom(msg.sender, address(this), amount);
        totalYieldPool += amount;
    }

    function distributeYield(address user, uint256 amount) external override {
        require(amount > 0, "Invalid yield amount");
        require(amount <= totalYieldPool, "Insufficient pool balance");

        rewardToken.transfer(user, amount);
        totalYieldPool -= amount;
    }
}
