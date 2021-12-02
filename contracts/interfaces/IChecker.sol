// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChecker {

  
    function isValid(address _who, bytes32 _cType) external view returns (bool);

    function isPassed(
        address _who, 
        bytes32 _programHash, 
        bytes32 _cType
    ) external view returns (bool);


    function addService(
        address _project, 
        bytes32 _cType,
        bytes32 _programHash, 
        bool _expectedResult
    ) external returns (bool);
}

