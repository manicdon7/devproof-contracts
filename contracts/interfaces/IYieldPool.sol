// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IYieldPool {
    function distributeYield(address user, uint256 amount) external;
}
