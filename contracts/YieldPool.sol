// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IYieldPool.sol";

contract YieldPool is Ownable, IYieldPool {
    uint256 public totalYieldPool;

    constructor() Ownable(msg.sender) {}

    function addYield() external payable onlyOwner {
        totalYieldPool += msg.value;
    }

    function distributeYield(address user, uint256 amount) external override {
        require(amount > 0, "Invalid yield amount");
        require(amount <= totalYieldPool, "Insufficient pool balance");

        totalYieldPool -= amount;
        (bool sent, ) = payable(user).call{value: amount}("");
        require(sent, "Failed to send yield");
    }

    // Allow contract to receive CORE tokens
    receive() external payable {}
}
