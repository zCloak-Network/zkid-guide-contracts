// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function threshold(address _addr) external view returns (uint256);
}

