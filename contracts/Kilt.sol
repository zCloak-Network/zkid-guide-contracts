// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./interfaces/IRegistry.sol";
import "./Properties.sol";
import "./interfaces/IWorker.sol";

contract ZeroKnowlegeProof is AccessControlEnumerable {
    

    struct Credential {
        bytes32 kiltAddress;
        // rootHash to prove the validity of the private data
        bytes32 rootHash;
        bool isValid;
    }
    
    struct ZKiltProof {
        address owner;
        bytes32 proofCid;
        bool isPassed;
    }

    // storage
    IRegistry public registry;


    // address => credential
    mapping(address => Credential) public certificate;
    mapping(address => mapping(bytes32 => ZKiltProof)) public proofs;
    

    // Default program to check data's validity of a cType
    mapping(bytes32 => bytes32) public validityProgram;
    
   
    event AddProof(address dataOwner, bytes32 kiltAddress, bytes32 rootHash, bytes32 programHash, bytes32 proofCid);
    event AddVerification(address dataOwner, bool isRevoked, bool isPassed);
    event SaveProofEvent(address sender, address owner, bytes programHash, string publicInputs, bool result);
    event SaveProofFailedEvent(address sender, address owner, bytes programHash, string publicInputs, bool result);
    event AddClassTypeEvent(string class, bytes programHash);
    event RemoveClassTypeEvent(string class);


    constructor(IRegistry _registry) {
        registry = _registry;
    }

    modifier isWorker(address _worker) {
        IWorker whitelist = registry.addressOf(Properties.CONTRACT_WHITELIST);
        require(whitelist.isWorker[_worker]);
        _;
    }


    // TODO: check existence ?
    function addProof(
        bytes32 _kiltAddress, 
        bytes32 _rootHash, 
        bytes32 _programHash, 
        bytes32 _proofCid
    ) public {
        
        ZKiltProof proof = ZKiltProof {
            owner: msg.sender,
            proofCid: _proofCid,
            isPassed: false
        };

        Credential credential = Credential {
            kiltAddress: _kiltAddress,
            rootHash: _rootHash,
            isValid: false
        };

        certificate[msg.sender] = credential;
        proofs[msg.sender][_programHash] = proof;

        emit AddProof(msg.sender, _kiltAddress, _rootHash, _programHash, _proofCid);
    }


    // TODO: reward worker？
    function addVerification(
        address _dataOwner, 
        bool _isRevoked, 
        bool _isPassed
    ) public isWorker(msg.sender) {
        if (!_isRevoked) {
            Credential storage credential = certificate[_dataOwner];
            credential.isValid = true;
        }

        if (_isPassed) {
            ZKiltProof storage proof = proofs[_dataOwner];
            proof.isPassed = true;
        } 
        
        emit AddVerification(_dataOwner, !_isRevoked, _isPassed);
    }

    // TODO: need to control access??
    function isValid(address _who) public view returns (bool) {
        Credential storage credential = certificate[_who];
        return credential.isValid;
    }

    function isPassed(address _who, bytes32 _programHash) public view returns (bool) {
        ZKiltProof storage proof = 
    }

    


    function addWhitelist(address white) public {
        _setWhite(white);
        emit AddWhitelistEvent(msg.sender, white);
    }

    function _setWhite(address white) internal {
        whitelist[white] = true;
    }

    function isWhitelist(address addr) public view returns (bool) {
        if (whitelist[addr]) {
            return true;
        }else{
            return false;
        }
    }

    function registerClass (
         string memory class,
         bytes memory programHash
        ) public {
        _addClass(class, programHash);
        emit AddClassTypeEvent(class, programHash);

    }

    function removeClass(string memory class) public {
        delete classes[class];
        emit RemoveClassTypeEvent(class);
    }

    function getClass(string memory class) public view returns (bytes memory) {
        return classes[class];
    }

    function _addClass(string memory class, bytes memory programHash) internal {
        classes[class] = programHash;
    }

}
