///
/// @dev The function that works are isValid() and isPassed(). The smart contract only use these
/// two functions transfer the data to worker. The worker implement the calculation logic of these
/// two functions.
///

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IRegistry.sol";
import "./interfaces/IRequest.sol";
import "./utils/Bytes32sUtils.sol";
import "./common/Properties.sol";
import "./common/AuthControl.sol";

contract KiltProofsV1 is AuthControl, Properties {
    bytes32 public constant NULL = "";


    // registry where we query global settings
    IRegistry public registry;

    mapping(address => bytes32) public addr2KiltAddr;
    mapping(bytes32 => address) public kiltAddr2Addr;

    // userAdd => requestHash => proofCid
    mapping(address => mapping(bytes32 => string)) public proofs;

    
    event AddProof(address dataOwner, bytes32 kiltAddress, bytes32 attester, bytes32 cType, bytes32 programHash, string fieldName, string proofCid, bytes32 rootHash, bool expectResult);
    event AddVerification(address dataOwner, address worker, bytes32 rootHash, bool isPassed);
    event AttesterApproved(bytes32 attester);

    constructor(IRegistry _registry) {
        registry = _registry;
    }    

    // check if the proof has been set
    function single_proof_exists(
        address _who,
        bytes32 _requestHash
    ) public view returns (bool) {
        return bytes(proofs[_who][_requestHash]).length != 0;
    }

    function addProof(
        bytes32 _kiltAccount, 
        bytes32 _attester,
        bytes32 _cType,
        string calldata _fieldName,
        bytes32 _programHash, 
        string calldata _proofCid,
        bytes32 _rootHash,
        bool _expResult
    ) public {
        // TODO: user <=> kiltAccount or user <=> rootHash?
        require(addr2KiltAddr[msg.sender] == bytes32(0) && kiltAddr2Addr[_kiltAccount] == address(0), "Kilt Account Already bounded.");
        // query request status
        IRequest request = IRequest(registry.addressOf(Properties.CONTRACT_REQUEST));
        bytes32 requestHash = keccak256(abi.encodePacked(_cType, _fieldName, _programHash, _expResult, _attester));
        // request.getRequestHash(_cType, _fieldName, _programHash, _expResult, _attester);

        require(!single_proof_exists(msg.sender, requestHash), "Your proof has already existed, do not add same proof again");
        _addProof(msg.sender, _kiltAccount, _attester, _cType, _fieldName, _programHash, _proofCid, _rootHash, _expResult, requestHash, request);
    }

    // TODO: change the validity in aggregator contract if the proofcid has
    // been updated.
    function update_proof(
        bytes32 _kiltAccount, 
        bytes32 _attester,
        bytes32 _cType,
        string calldata _fieldName,
        bytes32 _programHash, 
        string calldata _proofCid,
        bytes32 _rootHash,
        bool _expResult
    ) public {
        IRequest request = IRequest(registry.addressOf(Properties.CONTRACT_REQUEST));
        bytes32 requestHash = keccak256(abi.encodePacked(_cType, _fieldName, _programHash, _expResult, _attester));
        require(single_proof_exists(msg.sender, requestHash), "Your haven't add your proof before, please add it first");
        address boundedAddr = kiltAddr2Addr[_kiltAccount];
        // the maybe new KiltAccount can not be bounded to other address
        require(boundedAddr == msg.sender || boundedAddr == address(0), "Kilt Address already Bounded");
        _addProof(msg.sender, _kiltAccount, _attester, _cType, _fieldName, _programHash, _proofCid, _rootHash, _expResult, requestHash, request);
    }


    function _addProof(
        address _user,
        bytes32 _kiltAccount, 
        bytes32 _attester,
        bytes32 _cType,
        string memory _fieldName,
        bytes32 _programHash, 
        string memory _proofCid,
        bytes32 _rootHash, //TODO: any need to store roothash as part of the onchain kyc info?
        bool _expResult,
        bytes32 _requestHash,
        IRequest _request
    ) internal {

        if (!_request.exists(_requestHash)) {
            _request.initializeRequest(_cType, _fieldName, _programHash, _expResult, _attester);
        }

        // bind to kilt account
        addr2KiltAddr[_user] = _kiltAccount;
        kiltAddr2Addr[_kiltAccount] =_user;

        emit AddProof(_user, _kiltAccount, _attester, _cType, _programHash, _fieldName, _proofCid, _rootHash, _expResult);
    }
}