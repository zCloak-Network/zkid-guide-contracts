// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IFactory {

    function getRequestHash(address _nft) external view returns (bytes32);
}