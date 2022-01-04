// SPDX-License-Identifier: MIT
import "hardhat/console.sol";

pragma solidity ^0.8.0;

library AddressesUtils {

    struct Addresses {
        address[] addresses;
        mapping(address => uint) index;
    }

    // TODO: remove after testing
    function judgeEqual(Addresses storage _addresses, uint _num, address _addr) view public returns (bool) {
        if (_addresses.addresses[_addresses.index[_addr]] == _addresses.addresses[_num]) {
            return true;
        }
        return false;
    }

    function _addAddress(Addresses storage _addresses, address _addr) internal returns (bool) {
        // TODO: remove after testing
        // console.log("can go inside _addAddress()");
        // TODO: remove after testing, hide 'require' first
        // require(!exists(_addresses, _addr), "Already exists");
        uint length = _addresses.addresses.length;
        _addresses.addresses.push(_addr);
        _addresses.index[_addr] = length;
        return true;
    }

    // TODO: need test
    function _deleteAddress(Addresses storage _addresses, address _addr) internal returns (bool) {
        // TODO: remove after testing, hide 'require' first
        // require(exists(_addresses, _addr), "Does not exist");
        uint index = _addresses.index[_addr];
        uint length =  _addresses.addresses.length;
        address lastAddr = _addresses.addresses[length - 1];
        // move the last element to the target position and delete the last one
        _addresses.addresses[index] = lastAddr;
        // change index of the last element
        _addresses.index[lastAddr] = index;
        _addresses.addresses.pop();
        return true;
    }

    function exists(Addresses storage _addresses, address _addr) public view returns (bool) {
        // TODO: remove after testing
        console.log("can go inside exists()");
        console.log("_addresses.index[_addr]: ", _addresses.index[_addr]);
        console.log("_addr: ", _addr);
        console.log("_addresses.addresses[0]: ", _addresses.addresses[0]);
        
        return _addresses.index[_addr] != 0 || _addresses.addresses[0] == _addr;
    }
}