// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library Bytes32sUtils {
    struct Bytes32List {
        bytes32[] internalBytes32s;
        mapping(bytes32 => uint256) index;
    }

    function _addBytes32(Bytes32List storage _bytes32Array, bytes32 _bytes32)
        internal
        returns (bool)
    {
        require(!exists(_bytes32Array, _bytes32), "Already exists");
        uint256 length = _bytes32Array.internalBytes32s.length;
        _bytes32Array.internalBytes32s.push(_bytes32);
        _bytes32Array.index[_bytes32] = length;
        return true;
    }

    // TODO: need test
    function _deleteAddress(Bytes32List storage _bytes32Array, bytes32 _bytes32)
        internal
        returns (bool)
    {
        require(exists(_bytes32Array, _bytes32), "Does not exist");
        uint256 index = _bytes32Array.index[_bytes32];
        uint256 length = _bytes32Array.internalBytes32s.length;
        bytes32 lastBytes32 = _bytes32Array.internalBytes32s[length - 1];
        // move the last element to the target position and delete the last one
        _bytes32Array.internalBytes32s[index] = lastBytes32;
        // change index of the last element
        _bytes32Array.index[lastBytes32] = index;
        _bytes32Array.internalBytes32s.pop();
        return true;
    }

    function exists(Bytes32List storage _bytes32Array, bytes32 _bytes32)
        public
        view
        returns (bool)
    {
        if (_bytes32Array.internalBytes32s.length == 0) {
            return false;
        } else {
            return
                _bytes32Array.index[_bytes32] != 0 ||
                _bytes32Array.internalBytes32s[0] == _bytes32;
        }
    }

    function element(Bytes32List storage _bytes32Array, uint256 _index)
        public
        view
        returns (bytes32)
    {
        return _bytes32Array.internalBytes32s[_index];
    }

    function length(Bytes32List storage _bytes32Array)
        public
        view
        returns (uint256)
    {
        return _bytes32Array.internalBytes32s.length;
    }

    /// @dev Test function: judging array index and mapping variable whether equal or not
    function judgeEqual(
        Bytes32List storage _bytes32Array,
        uint256 _num,
        bytes32 _bytes32
    ) public view returns (bool) {
        if (
            _bytes32Array.internalBytes32s[_bytes32Array.index[_bytes32]] ==
            _bytes32Array.internalBytes32s[_num]
        ) {
            return true;
        }
        return false;
    }
}
