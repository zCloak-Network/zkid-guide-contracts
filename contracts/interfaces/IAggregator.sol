// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IAggregator {

    // clear zk profiles
    function clear(address _src, bytes32 _requestHash) external returns (bool);
}