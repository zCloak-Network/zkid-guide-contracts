// SPDX-License-Identifier: MIT

// OK to update
pragma solidity ^0.8.0;

contract Properties {

    /**
    * Address
     */
    bytes32 public constant CONTRACT_MAIN_KILT = "CONTRACT_MAIN_KILT";
    // address of the request management
    // v0.1.0 - ReadAccessController 
    bytes32 public constant CONTRACT_REQUEST = "CONTRACT_REQUEST";
    // address of reputation
    // v0.1.0 - ReputationV1 
    bytes32 public constant CONTRACT_REPUTATION = "CONTRACT_REPUTATION";
    // address of reward pool
    // v0.1.0 - ReputationV1 
    bytes32 public constant CONTRACT_REWARD = "CONTRACT_REWARD";
    
    // address of whitelist which a registry book for workers
    bytes32 public constant CONTRACT_WHITELIST = "CONTRACT_WHITELIST";
    // address of contract which is in charge of the read access to user's onchain kyc
    // v0.1.0 - ReadAccessController
    bytes32 public constant CONTRACT_READ_GATEWAY = "CONTRACT_READ_GATEWAY"; 


    /**
    * uint
     */
    // minimum commit submission number
    bytes32 public constant UINT32_MIN_COMMIT = "UINT32_MIN_COMMIT";
    // minimum threshold that could be used to decide the data validity
    bytes32 public constant UINT32_THRESHOLD = "UINT32_THRESHOLD";
}