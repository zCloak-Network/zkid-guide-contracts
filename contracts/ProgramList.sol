// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract ProgramList is Ownable {


    // how to describe a program??
    // age/nationality/
    // data validity

    event ProgramRegisted(bytes32 programHash);

    struct ProgramMetadata {
        bytes32 programHash;
        string githubLink;
    }

    // programHash => githubLink
    mapping(bytes32 => string) public programs;


    function add(bytes32 _programHash, string memory _githubLink) onlyOwner public {
        programs[_programHash] = _githubLink;
        emit ProgramRegisted(_programHash);
    }



}