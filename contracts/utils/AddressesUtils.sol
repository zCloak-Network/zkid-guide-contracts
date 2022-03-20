// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library AddressesUtils {
    struct Addresses {
        address[] addresses;
        mapping(address => uint256) index;
    }

    // do not revert the tx
    function _push(Addresses storage _addresses, address _addr) internal {
        if (exists(_addresses, _addr)) {
            return;
        }
        uint256 length = _addresses.addresses.length;
        _addresses.addresses.push(_addr);
        _addresses.index[_addr] = length;
    }

    // TODO: need test
    function _delete(Addresses storage _addresses, address _addr)
        internal
    {
        if (!exists(_addresses, _addr)) {
            return;
        }

        uint256 index = _addresses.index[_addr];
        uint256 length = _addresses.addresses.length;
        address lastAddr = _addresses.addresses[length - 1];
        // move the last element to the target position and delete the last one
        _addresses.addresses[index] = lastAddr;
        // change index of the last element
        _addresses.index[lastAddr] = index;
        _addresses.addresses.pop();
    }

    function exists(Addresses storage _addresses, address _addr)
        public
        view
        returns (bool)
    {
        if (_addresses.addresses.length == 0) {
            return false;
        } else {
            return
                _addresses.index[_addr] != 0 ||
                _addresses.addresses[0] == _addr;
        }
    }

    function element(Addresses storage _addresses, uint256 _index)
        public
        view
        returns (address)
    {
        return _addresses.addresses[_index];
    }

    /// get address length
    function length(Addresses storage _addresses)
        public
        view
        returns (uint256)
    {
        return _addresses.addresses.length;
    }

    /// @dev Test function: judging array index and mapping variable whether equal or not
    function judgeEqual(
        Addresses storage _addresses,
        uint256 _num,
        address _project
    ) public view returns (bool) {
        if (
            _addresses.addresses[_addresses.index[_project]] ==
            _addresses.addresses[_num]
        ) {
            return true;
        }
        return false;
    }

    /// @dev Test function: get member address array of struct Addresses
    function getAddress(Addresses storage _addresses, uint256 _num)
        public
        view
        returns (address)
    {
        return _addresses.addresses[_num];
    }

    /// @dev Test function: get member mapping variable of struct Addresses
    function getIndex(Addresses storage _addresses, address _project)
        public
        view
        returns (uint256)
    {
        return _addresses.index[_project];
    }
}
