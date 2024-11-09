// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PingCounter {
    mapping(address => uint256) public pingCounts;

    function ping() public {
        pingCounts[msg.sender]++;
    }

    function getPingCount(address user) public view returns (uint256) {
        return pingCounts[user];
    }
}