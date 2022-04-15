// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IFactory.sol";
import "./common/Properties.sol";
import "./ZcloakPoap.sol";

/**
 * @title requestHash, which the identifier of the combination of
 * (ctype, fieldname, programhash, attester), could be considered
 * as the identifier of a series NFTs
 * `PoapFactory` is where z-profile tracks all the did nfts.
 * @notice Not Active NOW.
 **/
contract PoapFactory is Ownable, IFactory {

    IRegistry public registry;

    // requestHash => proof of attributes
    mapping(bytes32 => address) public rh2poaps;
    // poap address => request hash
    mapping(address => bytes32) public poap2rhs;

    event PoapCreated(bytes32 requestHash, address poap);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }


    function newPoap(bytes32 _requestHash, string memory _uri, IRegistry _registry) public {
        require(rh2poaps[_requestHash] == address(0), "already created");

        address poapAddr = address(new ZCloakPoap(_uri, address(_registry)));

        rh2poaps[_requestHash]= poapAddr;
        poap2rhs[poapAddr] = _requestHash;

        emit PoapCreated(_requestHash, poapAddr);
    }

    function getRequestHash(address _nft) public override view returns (bytes32) {
        return poap2rhs[_nft];
    }
}
