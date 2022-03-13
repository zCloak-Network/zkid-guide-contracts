// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IReward {
    function punish(bytes32 requestHash, address worker) external;

    function reward(bytes32 requestHash, address worker) external;
}