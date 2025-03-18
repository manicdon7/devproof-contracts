// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStaking {
    function stake() external payable;
    function unstake(uint256 amount) external;
    function claimReward() external;
    function getTotalStaked() external view returns (uint256);
}

