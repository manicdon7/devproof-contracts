// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRewardDistribution {
    function distributeRewards(address user, uint256 amount) external;
}
