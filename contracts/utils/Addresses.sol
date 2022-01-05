// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library AddressesUtils {

    struct Addresses {
        address[] addresses;
        mapping(address => uint) index;
    }

    // TODO: remove after testing
    function judgeEqual(Addresses storage _addresses, uint _num, address _project) view public returns (bool) {
        if (_addresses.addresses[_addresses.index[_project]] == _addresses.addresses[_num]) {
            return true;
        }
        return false;
    }

    // TODO: remove after testing
    function getAddress(Addresses storage _addresses, uint256 _num) view public returns (address) {
        return _addresses.addresses[_num];
    }
    
    // TODO: remove after testing
    function getIndex(Addresses storage _addresses, address _project) view public returns (uint256) {
        return _addresses.index[_project];
    }

    function _addAddress(Addresses storage _addresses, address _addr) internal returns (bool) {
        require(!exists(_addresses, _addr), "Already exists");
        uint length = _addresses.addresses.length;
        _addresses.addresses.push(_addr);
        _addresses.index[_addr] = length;
        return true;
    }

    // TODO: need test
    function _deleteAddress(Addresses storage _addresses, address _addr) internal returns (bool) {
        require(exists(_addresses, _addr), "Does not exist");
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
        if (_addresses.addresses.length == 0) {
            return false;
        } else {
             return _addresses.index[_addr] != 0 || _addresses.addresses[0] == _addr;
        }
       
    }
}