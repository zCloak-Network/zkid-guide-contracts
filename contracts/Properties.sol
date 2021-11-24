// SPDX-License-Identifier: MIT

// OK to update
pragma solidity ^0.8.0;

contract Properties {

    // address
    bytes32 public constant CONTRACT_MAIN_KILT = "CONTRACT_MAIN_KILT";
    bytes32 public constant CONTRACT_WHITELIST = "CONTRACT_WHITELIST";
    bytes32 public constant CONTRACT_ACCESS = "CONTRACT_ACCESS"; 

    // uint256
    bytes32 public constant UINT_APPROVE_THRESHOLD = "UINT_APPROVE_THRESHOLD";
    bytes32 public constant UINT_MAX_TRUSTED_PROVIDERS = "UINT_MAX_TRUSTED_PROVIDERS";
    // for Kilt
    bytes32 public constant UINT_MAX_KILT_CTYPES = "UINT_MAX_TRUSTED_CTYPES";
}