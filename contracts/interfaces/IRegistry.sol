///
/// @dev 改合约为一个接口类合约，在该合约中，定义了很多可供实现的函数
/// 接口类合约还对应一个实现类合约，该接口类合约（IRegistry.sol）的实现类合约为 Registry.sol，在实现类合约中实现了接口类合约中的函数
///
/// 用法：
/// IRegistry public registry;
/// registry = IRegistry(Registry实现类合约的地址)；
/// registry.stringOf("propertyName");
///

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRegistry {

    function uintOf(bytes32 _propertyName) external view returns (uint256);

    function stringOf(bytes32 _propertyName) external view returns (string memory);

    function addressOf(bytes32 _propertyName) external view returns (address);

    function bytesOf(bytes32 _propertyName) external view returns (bytes memory);

    function boolOf(bytes32 _propertyName) external view returns (bool);

    function intOf(bytes32 _propertyName) external view returns (int);

}
