// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChecker {

  
    function isValid(address _who, bytes32 _cType) external view returns (bool);

    function isPassed(
        address _who, 
        bytes32 _cType, 
        bytes32 _programHash
    ) external view returns (bool);
}

