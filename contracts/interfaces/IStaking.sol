// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStaking {
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimReward() external;
    function getTotalStaked() external view returns (uint256);
}
