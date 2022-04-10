// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IChecker {

    // return true only if credential is valid and proof has passed the verification,
    function zkID(address _who, bytes32 _requestHash) external view returns (bool, uint128[] memory calcOutput);

}

