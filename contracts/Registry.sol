// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {

    enum SettingsValueTypes { NONE, UINT, STRING, ADDRESS, BYTES, BOOL, INT }

    mapping(bytes32 => uint256) public uintProperties;
    mapping(bytes32 => uint32) public uint32Properties;
    mapping(bytes32 => string) public stringProperties;
    mapping(bytes32 => address) public addressProperties;
    mapping(bytes32 => bytes) public bytesProperties;
    mapping(bytes32 => bool) public boolProperties;
    mapping(bytes32 => int256) public intProperties;

    event ChangeProperty(bytes32 indexed _propertyName, uint256 _type);

    function uintOf(bytes32 _propertyName) public view returns (uint256) {
        return uintProperties[_propertyName];
    }

    function uint32Of(bytes32 _propertyName) public view returns (uint32) {
        return uint32Properties[_propertyName];
    }

    function stringOf(bytes32 _propertyName) public view returns (string memory) {
        return stringProperties[_propertyName];
    }

    function addressOf(bytes32 _propertyName) public view returns (address) {
        return addressProperties[_propertyName];
    }

    function bytesOf(bytes32 _propertyName) public view returns (bytes memory) {
        return bytesProperties[_propertyName];
    }

    function boolOf(bytes32 _propertyName) public view returns (bool) {
        return boolProperties[_propertyName];
    }

    function intOf(bytes32 _propertyName) public view returns (int) {
        return intProperties[_propertyName];
    }

    function setUintProperty(bytes32 _propertyName, uint _value) public onlyOwner {
        uintProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.UINT));
    }

    function setStringProperty(bytes32 _propertyName, string memory _value) public onlyOwner {
        stringProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.STRING));
    }

    function setAddressProperty(bytes32 _propertyName, address _value) public onlyOwner {
        addressProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.ADDRESS));
    }

    function setBytesProperty(bytes32 _propertyName, bytes memory _value) public onlyOwner {
        bytesProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.BYTES));
    }

    function setBoolProperty(bytes32 _propertyName, bool _value) public onlyOwner {
        boolProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.BOOL));
    }

    function setIntProperty(bytes32 _propertyName, int _value) public onlyOwner {
        intProperties[_propertyName] = _value;
        emit ChangeProperty(_propertyName, uint256(SettingsValueTypes.INT));
    }
}