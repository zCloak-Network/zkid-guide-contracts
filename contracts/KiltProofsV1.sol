///
/// @dev The function that works are isValid() and isPassed(). The smart contract only use these
/// two functions transfer the data to worker. The worker implement the calculation logic of these
/// two functions.
///

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IRegistry.sol";
import "./utils/Bytes32Array.sol";
import "./common/Properties.sol";
import "./common/AuthControl.sol";

contract KiltProofsV1 is AuthControl, Properties {
    bytes32 public constant NULL = "";
    
    // struct Credential {
    //     bytes32 kiltAddress;
    //     // rootHash to prove the validity of the private data
    //     mapping(bytes32 => uint256) approvedRootHash;
    //     bytes32 finalRootHash;
    // }

    // struct StarkProof {
    //     address owner;
    //     string fieldName;
    //     string proofCid;
    //     // rootHash => expectResult => votes
    //     mapping(bytes32 => mapping(bool => uint256)) approveCount;
    // }

    struct RequestDetails {
        bytes32 cType;
        string fieldName;
        bytes32 programHash;
        bool expResult;
        bytes32 attester;
    }

    // registry where we query global settings
    IRegistry public registry;

    // TODO: old
    // confirmed attesters by zCloak and community
    // AttesterID => isConfirmed
    mapping(bytes32 => bool) defaultAttesters;
    
    mapping(address => bytes32) public addr2KiltAddr;
    mapping(bytes32 => address) public kiltAddr2Addr;

    // userAdd => requestHash => proofCid
    mapping(address => mapping(bytes32 => string)) proofs;

    // userAdd => requestHash => requestDetails
    mapping(address => mapping(bytes32 => RequestDetails)) requests;
    // // user => ctype => programHash => workerAddress => rootHash
    // mapping(address => mapping(bytes32 => mapping(bytes32 => mapping(address => bytes32)))) public submissionRecords;

    // // TODO: should be 'private', 'public' just for testing
    // // address => cType => Credential
    // mapping(address => mapping(bytes32 => Credential)) public certificate;

    // // TODO: should be 'private', 'public' just for testing
    // // address => (cType => (programHash => StarkProof)))
    // mapping(address => mapping(bytes32 => mapping(bytes32 => StarkProof))) public proofs;

    // // expected output
    // // cType => programHash => expectedResult
    // mapping(bytes32 => mapping(bytes32 => bool)) expectedResult;   
    
    event AddProof(address dataOwner, bytes32 kiltAddress, bytes32 attester, bytes32 cType, bytes32 programHash, string fieldName, string proofCid, bool expectResult);
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
        require(addr2KiltAddr[msg.sender] == bytes32(0) && kiltAddr2Addr[_kiltAccount] == address(0), "Kilt Account Already bounded.");
        bytes32 requestHash = keccak256(abi.encodePacked(_cType, _fieldName, _programHash, _expResult, _attester));
        require(!single_proof_exists(msg.sender, requestHash), "Your proof has already existed, do not add same proof again");
        _addProof(msg.sender, _kiltAccount, _attester, _cType, _fieldName, _programHash, _proofCid, _expResult, requestHash);
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
        bytes32 requestHash = keccak256(abi.encodePacked(_cType, _fieldName, _programHash, _expResult, _attester));
        require(single_proof_exists(msg.sender, requestHash), "Your haven't add your proof before, please add it first");
        address boundedAddr = kiltAddr2Addr[_kiltAccount];
        // the maybe new KiltAccount can not be bounded to other address
        require(boundedAddr == msg.sender || boundedAddr == address(0), "Kilt Address already Bounded");
        _addProof(msg.sender, _kiltAccount, _attester, _cType, _fieldName, _programHash, _proofCid, _expResult, requestHash);
    }

    // // @param _rootHash if rootHash is revoked on Kilt or does not exist on Kilt Network, this will be set to NULL
    // function addVerification(
    //     address _dataOwner,  
    //     bytes32 _rootHash,
    //     bytes32 _cType,
    //     bytes32 _programHash,
    //     bool _isPassed // proof verification result
    // ) public auth() {
    //     require(single_proof_exists(_dataOwner, _cType, _programHash), "the Proof does not exist");
    //     require(!hasSubmitted(_dataOwner, msg.sender, _rootHash, _cType, _programHash), "you have already submitted");
    //     _addVerification(_dataOwner, msg.sender, _rootHash, _cType, _programHash, _isPassed);
    // }

    function approveAttester(bytes32 _attester) public auth() {
        defaultAttesters[_attester] = true;
        emit AttesterApproved(_attester);
    }


    // function hasSubmitted(
    //     address _dataOwner,  
    //     address _worker,
    //     bytes32 _rootHash,
    //     bytes32 _cType,
    //     bytes32 _programHash
    // ) public view returns (bool) {
    //     return _rootHash == submissionRecords[_dataOwner][_cType][_programHash][_worker];  
    // }

    // clear the proof's verification status
    // function _clear_proof(StarkProof storage _proof, bytes32 _rootHash) internal {
    //     _proof.approveCount[_rootHash][true] = 0;
    //     _proof.approveCount[_rootHash][false] = 0;
    // }


    function _addProof(
        address _user,
        bytes32 _kiltAccount, 
        bytes32 _attester,
        bytes32 _cType,
        string memory _fieldName,
        bytes32 _programHash, 
        string memory _proofCid,
        bool _expResult,
        bytes32 _requestHash
    ) internal {
        require(defaultAttesters[_attester] == true, "Not qualified attester");
        // modify request
        RequestDetails storage request = requests[_user][_requestHash];
        request.cType = _cType;
        request.fieldName = _fieldName;
        request.programHash = _programHash;
        request.expResult = _expResult;
        request.attester = _attester;

        // modify proof
        string memory oldProofCid = proofs[_user][_requestHash];
        proofs[_user][_requestHash] = _proofCid;

        if (keccak256(abi.encode(oldProofCid)) != keccak256("") && keccak256(abi.encode(oldProofCid)) != keccak256(abi.encode(_proofCid))) {
            // TODO: nofity aggregator the validity changed
        }

        // bind to kilt account
        addr2KiltAddr[_user] = _kiltAccount;
        kiltAddr2Addr[_kiltAccount] =_user;

        emit AddProof(_user, _kiltAccount, _attester, _cType, _programHash, _fieldName, _proofCid, _expResult);
    }



    // // TODO: reward worker？
    // function _addVerification(
    //     address _dataOwner,  
    //     address _worker,
    //     bytes32 _rootHash,
    //     bytes32 _cType,
    //     bytes32 _programHash,
    //     bool _isPassed // proof verification result
    // ) internal {
    //     // rootHash is not valid only if it is NULL
    //     if (_rootHash == NULL) {
    //         return;
    //     }

    //     Credential storage credential = certificate[_dataOwner][_cType];
    //     // successfully finalized the validity if true
    //     _apporveCredential(credential, _rootHash);
    //     StarkProof storage proof = proofs[_dataOwner][_cType][_programHash];
    //     _approveStarkProof(proof, _rootHash, _isPassed);

    //     // record the submission
    //     submissionRecords[_dataOwner][_cType][_programHash][_worker] = _rootHash;
        
    //     emit AddVerification(_dataOwner, msg.sender, _rootHash, _isPassed);
    // }

    // function _apporveCredential(
    //     Credential storage _credential, 
    //     bytes32 _rootHash
    // ) internal {
    //     _credential.approvedRootHash[_rootHash]++;
    //     bytes32 lastFinalRootHash = _credential.finalRootHash;
    //     // initialize finalRootHash
    //     if (_credential.finalRootHash == NULL) {
    //         _credential.finalRootHash = _rootHash;
    //     }

    //     // update finalRootHash if _rootHash owns the highest vote
    //     uint lastFinalcount = _credential.approvedRootHash[lastFinalRootHash];
    //     if (_rootHash != lastFinalRootHash && 
    //         _credential.approvedRootHash[_rootHash] > lastFinalcount
    //     ) {
    //         _credential.finalRootHash = _rootHash;
    //     }
    // }

    // function _approveStarkProof(
    //     StarkProof storage _proof, 
    //     bytes32 _rootHash,
    //     bool _isPassed
    // ) internal {
    //     _proof.approveCount[_rootHash][_isPassed]++;
    // }

    //  // return finalRootHash and its votes
    // function credentialProcess(address _who, bytes32 _cType) override public view returns (bytes32, uint256) {
    //     Credential storage credential = certificate[_who][_cType];
    //     bytes32 rootHash = credential.finalRootHash;
    //     return (rootHash, credential.approvedRootHash[rootHash]);
    // }

    // // return verification process
    // function verificationProcess(
    //     address _who, 
    //     bytes32 _cType, 
    //     bytes32 _programHash,
    //     bytes32 _rootHash,
    //     bool _expectResult
    // ) override public view returns (uint256) {
    //     StarkProof storage proof = proofs[_who][_cType][_programHash];
    //     return proof.approveCount[_rootHash][_expectResult];
    // }

}