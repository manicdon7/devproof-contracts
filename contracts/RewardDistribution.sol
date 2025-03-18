// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRewardDistribution.sol";

contract RewardDistribution is Ownable, IRewardDistribution {
    constructor() Ownable(msg.sender) {}

    function distributeRewards(address user, uint256 amount) external override {
        require(amount > 0, "No rewards available");
        require(address(this).balance >= amount, "Insufficient reward balance");

        (bool sent, ) = payable(user).call{value: amount}("");
        require(sent, "Failed to send reward");
    }

    // Allow contract to receive CORE tokens
    receive() external payable {}
}
