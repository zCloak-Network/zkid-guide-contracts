// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAccess {
    function ableToAccess(address _who) external view returns (bool);
}