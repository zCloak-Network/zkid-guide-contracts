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
    // uint256
    bytes32 public constant UINT_APPROVE_THRESHOLD = "UINT_APPROVE_THRESHOLD";
    bytes32 public constant UINT_MAX_TRUSTED_PROVIDERS = "UINT_MAX_TRUSTED_PROVIDERS";

}