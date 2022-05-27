// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IAuthority {

    // check the function sig should be called by _src
    function canCall(address _src, address _dst, bytes4 _sig) external view returns (bool);
}