// SPDX-License-Identifier: MIT

// OK to update
pragma solidity ^0.8.0;

contract Properties {

    // address
    bytes32 public constant CONTRACT_MAIN_KILT = "CONTRACT_MAIN_KILT";
    // address of whitelist which a registry book for workers
    bytes32 public constant CONTRACT_WHITELIST = "CONTRACT_WHITELIST";
    // address of oracle contract
    bytes32 public constant CONTRACT_ORACLE = "CONTRACT_ORACLE"; 
    // the reputation record of workers
    bytes32 public constant CONTRACT_REPUTATION = "CONTRACT_REPUTATION";
    // minimum commit submission number
    bytes32 public constant UINT32_MIN_COMMIT = "UINT32_MIN_COMMIT";
    // minimum threshold that could be used to decide the data validity
    bytes32 public constant UINT32_THRESHOLD = "UINT32_THRESHOLD";
}