// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

pragma experimental ABIEncoderV2;

import "./common/Ownable.sol";

import "@openzeppelin/contracts/proxy/Initializable.sol";


contract ReliableInstitution is Ownalbe, Initializable{

    event UpdateStorageKeysEvent(bytes[] keys, bool result);

    bytes[] private storageKeys;

    function initialize() public initializer {
        ownableConstructor();
    }

    function updateStorageKeys(bytes[] memory keys) public onlyOwner {
        require(keys.length > 0, "ReliableInstitution public key list is empty");
        storageKeys = keys;
        emit UpdateStorageKeysEvent(keys, true);
    }







}