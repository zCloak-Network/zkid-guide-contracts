// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IAccess.sol";
import "./Properties.sol";
import "./interfaces/IWorker.sol";

contract KiltProofs is AccessControlEnumerable, Properties {
    

    struct Credential {
        bytes32 kiltAddress;
        // rootHash to prove the validity of the private data
        mapping(bytes32 => uint256) approvedRootHash;
        bytes32 finalRootHash;
    }

    struct StarkProof {
        address owner;
        bytes32 proofCid;
        mapping(bool => uint256) approveCount;
        bool isPassed;
    }

    // storage
    IRegistry public registry;


    // address => cType => Credential
    mapping(address => mapping(bytes32 => Credential)) public certificate;

    // address => (programHash => (fieldName => StarkProof)))
    mapping(address => mapping(bytes32 => mapping(bytes32 => StarkProof))) public proofs;
   
    event AddProof(address dataOwner, bytes32 kiltAddress, bytes32 cType, bytes32 programHash, bytes32 proofCid);
    event AddVerification(address dataOwner, address worker, bool isRevoked, bool isPassed);
   

    constructor(IRegistry _registry) {
        registry = _registry;
    }

    modifier isWorker(address _worker) {
        IWorker whitelist = IWorker(registry.addressOf(Properties.CONTRACT_WHITELIST));
        require(whitelist.isWorker(_worker));
        _;
    }

    // TODO: complete this later!
    // add projects registration
    modifier isRegistered(address _who) {
        _;
    }

    function addProof(
        bytes32 _kiltAddress, 
        bytes32 _cType,
        bytes32 _fieldName,
        bytes32 _programHash, 
        bytes32 _proofCid
    ) public {
        _addProof(msg.sender, _kiltAddress, _cType, _fieldName, _programHash, _proofCid);
    }

    function addVerification(
        address _dataOwner,  
        bytes32 _rootHash,
        bytes32 _cType,
        bytes32 _fieldName,
        bytes32 _programHash,
        bool _isValid, // data validity
        bool _isPassed // proof verification result
    ) public isWorker(msg.sender) {
        _addVerification(_dataOwner, _rootHash, _cType, _fieldName, _programHash, _isValid, _isPassed);
    }

   
    // TODO: check existence
    function _addProof(
        address _user,
        bytes32 _kiltAddress, 
        bytes32 _cType,
        bytes32 _fieldName,
        bytes32 _programHash, 
        bytes32 _proofCid
    ) internal {
        
        StarkProof storage proof = proofs[_user][_programHash][_fieldName];
        proof.owner = _user;
        proof.proofCid = _proofCid;
        
        Credential storage credential =  certificate[_user][_cType];
        credential.kiltAddress = _kiltAddress;

        emit AddProof(_user, _kiltAddress, _cType, _programHash, _proofCid);
    }



    // TODO: reward worker？
    function _addVerification(
        address _dataOwner,  
        bytes32 _rootHash,
        bytes32 _cType,
        bytes32 _fieldName,
        bytes32 _programHash,
        bool _isValid, // data validity
        bool _isPassed // proof verification result
    ) internal {
        if (!_isValid) {
            return;
        }

        Credential storage credential = certificate[_dataOwner][_cType];
        // successfully finalized the validity if true
        _apporveCredential(credential, _rootHash);
        StarkProof storage proof = proofs[_dataOwner][_programHash][_fieldName];
        _approveStarkProof(proof, _isPassed);
        
        emit AddVerification(_dataOwner, msg.sender, _isValid, _isPassed);
    }

    function _apporveCredential(
        Credential storage _credential, 
        bytes32 _rootHash
    ) internal returns (bool) {

        uint threshold = registry.uintOf(Properties.UINT_APPROVE_THRESHOLD);
        _credential.approvedRootHash[_rootHash]++;
        if (_credential.approvedRootHash[_rootHash] >= threshold) {
            _credential.finalRootHash = _rootHash;
            return true;
        }
        return false;
    }

    function _approveStarkProof(
        StarkProof storage _proof, 
        bool _res
    ) internal {
         uint threshold = registry.uintOf(Properties.UINT_APPROVE_THRESHOLD);
        _proof.approveCount[_res]++;
        if (_proof.approveCount[_res] >= threshold) {
            // reach the threshold AND proof is verified true
            _proof.isPassed = _res && true;
        }
    }

    // TODO: need to control access??
    function isValid(address _who, bytes32 _cType) public view returns (bool) {
        Credential storage credential = certificate[_who][_cType];
        return credential.finalRootHash == 0x0;
    }

    function isPassed(address _who, bytes32 _programHash, bytes32 _fieldName) public view returns (bool) {
        StarkProof storage proof = proofs[_who][_programHash][_fieldName];
        return proof.isPassed;
    }


}
