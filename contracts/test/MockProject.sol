// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IChecker.sol";

contract MockProject {
    
    IChecker public checker;
    
    constructor(address _checker) {
        checker = IChecker(_checker);
    }

    function isValid(address _who, bytes32 _requestHash) external view returns (bool) {
        return checker.isValid(_who, _requestHash);
    }
}