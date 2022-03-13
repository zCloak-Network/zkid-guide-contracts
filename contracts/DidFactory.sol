// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

/**
 * @title programHash, always pointing to a specific blob of zkVM program,
 * can be also considered as the identifier of a DID NFT.
 * `DidFactory` is where z-profile tracks all the did nfts.
 * @notice Not Active NOW.
 **/
contract DidFactory is Ownable {

    // program => nft
    mapping(bytes32 => IERC721) public did;

    event DIDCreated(bytes32 programHash, address didNFT);


    function newDID(bytes32 _programHash) public onlyOwner() {
        require(did[_programHash] == IERC721(address(0)), "already created");
        // TODO: any method to fetch the program metadata?
        // TODO: 
        address newDid = address(new ERC721(string(abi.encode(_programHash)), string(abi.encode("zCloak DID", _programHash))));
        emit DIDCreated(_programHash, newDid);
    }


    // add mint

}