///
/// @dev The function that works are isValid() and isPassed(). The smart contract only use these
/// two functions transfer the data to worker. The worker implement the calculation logic of these
/// two functions.
///

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IRegistry.sol";
import "./interfaces/IRawChecker.sol";
import "./utils/Bytes32Array.sol";
import "./common/Properties.sol";
import "./common/AuthControl.sol";

contract KiltProofsV1 is AuthControl, IRawChecker, Properties {
    bytes32 public constant NULL = "";
    
    struct Credential {
        bytes32 kiltAddress;
        // rootHash to prove the validity of the private data
        mapping(bytes32 => uint256) approvedRootHash;
        bytes32 finalRootHash;
    }

    struct StarkProof {
        address owner;
        string fieldName;
        string proofCid;
        // rootHash => expectResult => votes
        mapping(bytes32 => mapping(bool => uint256)) approveCount;
    }

    // registry where we query global settings
    IRegistry public registry;

    // confirmed attesters by zCloak and community
    // AttesterID => isConfirmed
    mapping(bytes32 => bool) defaultAttesters;
    

    // user => ctype => programHash => workerAddress => rootHash
    mapping(address => mapping(bytes32 => mapping(bytes32 => mapping(address => bytes32)))) public submissionRecords;

    // TODO: should be 'private', 'public' just for testing
    // address => cType => Credential
    mapping(address => mapping(bytes32 => Credential)) public certificate;

    // TODO: should be 'private', 'public' just for testing
    // address => (cType => (programHash => StarkProof)))
    mapping(address => mapping(bytes32 => mapping(bytes32 => StarkProof))) public proofs;

    // expected output
    // cType => programHash => expectedResult
    mapping(bytes32 => mapping(bytes32 => bool)) expectedResult;   
    
    event AddProof(address dataOwner, bytes32 kiltAddress, bytes32 attester, bytes32 cType, bytes32 programHash, string fieldName, string proofCid, bytes32 rootHash, bool expectResult);
    event AddVerification(address dataOwner, address worker, bytes32 rootHash, bool isPassed);
    event AttesterApproved(bytes32 attester);

    constructor(IRegistry _registry) {
        registry = _registry;
    }    

    // check if the proof has been set
    function single_proof_exists(
        address _who,
        bytes32 _cType,
        bytes32 _programHash
    ) public view returns (bool) {
        StarkProof storage proof = proofs[_who][_cType][_programHash];
        return proof.owner == _who 
            && bytes(proof.fieldName).length != 0
            && bytes(proof.proofCid).length != 0;
    }

    function addProof(
        bytes32 _kiltAddress, 
        bytes32 _attester,
        bytes32 _cType,
        string memory _fieldName,
        bytes32 _programHash, 
        string memory _proofCid,
        bytes32 _rootHash,
        bool _expectResult
    ) public {
        require(!single_proof_exists(msg.sender, _cType, _programHash), "Your proof has already existed, do not add same proof again");
        _addProof(msg.sender, _kiltAddress, _attester, _cType, _fieldName, _programHash, _proofCid, _rootHash, _expectResult);
    }

    function update_proof(
        bytes32 _kiltAddress, 
        bytes32 _attester,
        bytes32 _cType,
        string memory _fieldName,
        bytes32 _programHash, 
        string memory _proofCid,
        bytes32 _rootHash,
        bool _expectResult
    ) public {
        require(single_proof_exists(msg.sender, _cType, _programHash), "Your haven't add your proof before, please add it first");
        StarkProof storage proof = proofs[msg.sender][_cType][_programHash];
        if (keccak256(bytes(proof.proofCid)) != keccak256(bytes(_proofCid))) {
            _clear_proof(proof, _rootHash);
        }

        Credential storage credential = certificate[msg.sender][_cType];
        if (credential.finalRootHash != _rootHash) {
            credential.finalRootHash = NULL;
        }

        _addProof(msg.sender, _kiltAddress, _attester, _cType, _fieldName, _programHash, _proofCid, _rootHash, _expectResult);
    }

    // @param _rootHash if rootHash is revoked on Kilt or does not exist on Kilt Network, this will be set to NULL
    function addVerification(
        address _dataOwner,  
        bytes32 _rootHash,
        bytes32 _cType,
        bytes32 _programHash,
        bool _isPassed // proof verification result
    ) public auth() {
        require(single_proof_exists(_dataOwner, _cType, _programHash), "the Proof does not exist");
        require(!hasSubmitted(_dataOwner, msg.sender, _rootHash, _cType, _programHash), "you have already submitted");
        _addVerification(_dataOwner, msg.sender, _rootHash, _cType, _programHash, _isPassed);
    }

    function approveAttester(bytes32 _attester) public auth() {
        defaultAttesters[_attester] = true;
        emit AttesterApproved(_attester);
    }


    function hasSubmitted(
        address _dataOwner,  
        address _worker,
        bytes32 _rootHash,
        bytes32 _cType,
        bytes32 _programHash
    ) public view returns (bool) {
        return _rootHash == submissionRecords[_dataOwner][_cType][_programHash][_worker];  
    }

    // clear the proof's verification status
    function _clear_proof(StarkProof storage _proof, bytes32 _rootHash) internal {
        _proof.approveCount[_rootHash][true] = 0;
        _proof.approveCount[_rootHash][false] = 0;
    }

   
    // TODO: check existence
    function _addProof(
        address _user,
        bytes32 _kiltAddress, 
        bytes32 _attester,
        bytes32 _cType,
        string memory _fieldName,
        bytes32 _programHash, 
        string memory _proofCid,
        bytes32 _rootHash,
        bool _result
    ) internal {
        require(defaultAttesters[_attester] == true, "Not qualified attester");
        StarkProof storage proof = proofs[_user][_cType][_programHash];
        proof.fieldName = _fieldName;
        proof.owner = _user;
        proof.proofCid = _proofCid;
        
        Credential storage credential =  certificate[_user][_cType];
        credential.kiltAddress = _kiltAddress;

        emit AddProof(_user, _kiltAddress, _attester, _cType, _programHash, _fieldName, _proofCid, _rootHash, _result);
    }



    // TODO: reward worker？
    function _addVerification(
        address _dataOwner,  
        address _worker,
        bytes32 _rootHash,
        bytes32 _cType,
        bytes32 _programHash,
        bool _isPassed // proof verification result
    ) internal {
        // rootHash is not valid only if it is NULL
        if (_rootHash == NULL) {
            return;
        }

        Credential storage credential = certificate[_dataOwner][_cType];
        // successfully finalized the validity if true
        _apporveCredential(credential, _rootHash);
        StarkProof storage proof = proofs[_dataOwner][_cType][_programHash];
        _approveStarkProof(proof, _rootHash, _isPassed);

        // record the submission
        submissionRecords[_dataOwner][_cType][_programHash][_worker] = _rootHash;
        
        emit AddVerification(_dataOwner, msg.sender, _rootHash, _isPassed);
    }

    function _apporveCredential(
        Credential storage _credential, 
        bytes32 _rootHash
    ) internal {
        _credential.approvedRootHash[_rootHash]++;
        bytes32 lastFinalRootHash = _credential.finalRootHash;
        // initialize finalRootHash
        if (_credential.finalRootHash == NULL) {
            _credential.finalRootHash = _rootHash;
        }

        // update finalRootHash if _rootHash owns the highest vote
        uint lastFinalcount = _credential.approvedRootHash[lastFinalRootHash];
        if (_rootHash != lastFinalRootHash && 
            _credential.approvedRootHash[_rootHash] > lastFinalcount
        ) {
            _credential.finalRootHash = _rootHash;
        }
    }

    function _approveStarkProof(
        StarkProof storage _proof, 
        bytes32 _rootHash,
        bool _isPassed
    ) internal {
        _proof.approveCount[_rootHash][_isPassed]++;
    }

     // return finalRootHash and its votes
    function credentialProcess(address _who, bytes32 _cType) override public view returns (bytes32, uint256) {
        Credential storage credential = certificate[_who][_cType];
        bytes32 rootHash = credential.finalRootHash;
        return (rootHash, credential.approvedRootHash[rootHash]);
    }

    // return verification process
    function verificationProcess(
        address _who, 
        bytes32 _cType, 
        bytes32 _programHash,
        bytes32 _rootHash,
        bool _expectResult
    ) override public view returns (uint256) {
        StarkProof storage proof = proofs[_who][_cType][_programHash];
        return proof.approveCount[_rootHash][_expectResult];
    }

    // The following functions are test functions which is remarked as 'remove after testing'.
    // TODO: remove after testing
    function getApprovedRootHash(
        address _dataOwner,
        bytes32 _cType,
        bytes32 _rootHash
    ) view public auth() returns(uint256) {
        Credential storage _credential = certificate[_dataOwner][_cType];
        return (_credential.approvedRootHash[_rootHash]);
    }

    // TODO: remove after testing
    function getApproveCount(
        address _dataOwner,
        bytes32 _cType,
        bytes32 _programHash,
        bytes32 _rootHash,
        bool _isPassed
    ) view public auth() returns(uint256) {
        StarkProof storage _proof = proofs[_dataOwner][_cType][_programHash];
        return (_proof.approveCount[_rootHash][_isPassed]);
    }
}