// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChecker {

    // return true only if credential is valid and proof has passed the verification,
    function isValid(
        address _who, 
        bytes32 _cType, 
        bytes32 _programHash,
        bool _expectResult
    ) external view returns (bool);

}

