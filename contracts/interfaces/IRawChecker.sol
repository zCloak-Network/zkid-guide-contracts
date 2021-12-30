// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRawChecker {

    // return finalRootHash and its votes
    function credentialProcess(address _who, bytes32 _cType) external view returns (bytes32, uint256);

    // return verification process
    function verificationProcess(
        address _who, 
        bytes32 _cType, 
        bytes32 _programHash,
        bytes32 _rootHash,
        bool _expectResult
    ) external view returns (uint256);
}