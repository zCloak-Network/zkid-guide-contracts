// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRegistry {

    function uintOf(bytes32 _propertyName) external view returns (uint256);

    function uint32Of(bytes32 _propertyName) external view returns (uint32);

    function stringOf(bytes32 _propertyName) external view returns (string memory);

    function addressOf(bytes32 _propertyName) external view returns (address);

    function bytesOf(bytes32 _propertyName) external view returns (bytes memory);

    function boolOf(bytes32 _propertyName) external view returns (bool);

    function intOf(bytes32 _propertyName) external view returns (int);

}
