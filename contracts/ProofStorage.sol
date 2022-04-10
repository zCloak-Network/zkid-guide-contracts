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
import "@openzeppelin/contracts/utils/Context.sol";

contract ProofStorage is Context, AuthControl, Properties {
    bytes32 public constant NULL = "";

    // registry where we query global settings
    IRegistry public registry;

    // kiltAccount => userAddress
    // TODO: any need to remove?
    mapping(bytes32 => address) public kiltAddr2Addr;

    // userAddr => requestHash => proofCid
    mapping(address => mapping(bytes32 => string)) public proofs;

    event AddProof(
        address dataOwner,
        bytes32 kiltAddress,
        bytes32 attester,
        bytes32 cType,
        bytes32 programHash,
        string fieldName,
        string proofCid,
        bytes32 requestHash,
        uint128[] expectResult
    );

    event UpdateProof(
        address dataOwner,
        bytes32 kiltAccount,
        bytes32 requestHash,
        string proofCid
    );

    constructor(IRegistry _registry) {
        registry = _registry;
    }

    // check if the proof has been set
    function single_proof_exists(address _who, bytes32 _requestHash)
        public
        view
        returns (bool)
    {
        return bytes(proofs[_who][_requestHash]).length != 0;
    }

    function addProof(
        bytes32 _kiltAccount,
        bytes32 _attester,
        bytes32 _cType,
        string calldata _fieldName,
        bytes32 _programHash,
        string calldata _proofCid,
        uint128[] calldata _expResult // includes rootHash
    ) public {
        // query request status
        IRequest request = IRequest(
            registry.addressOf(Properties.CONTRACT_REQUEST)
        );

        IRequest.RequestDetail memory d = IRequest.RequestDetail({
            cType: _cType,
            fieldName: _fieldName,
            programHash: _programHash,
            expResult: _expResult,
            attester: _attester
        });

        bytes32 requestHash = request.getRequestHash(d);

        require(
            !single_proof_exists(_msgSender(), requestHash),
            "Your proof has already existed, do not add same proof again"
        );

        // add requethash metadata
        if (!request.exists(requestHash)) {
            request.initializeRequest(d);
        }

        _addProof(_msgSender(), _kiltAccount, _proofCid, requestHash);

        emit AddProof(
            _msgSender(),
            _kiltAccount,
            _attester,
            _cType,
            _programHash,
            _fieldName,
            _proofCid,
            requestHash,
            _expResult
        );
    }

    function update_proof(
        bytes32 _kiltAccount,
        bytes32 _requestHash,
        string calldata _proofCid
    ) public {
        require(
            single_proof_exists(_msgSender(), _requestHash),
            "Your haven't add your proof before, please add it first"
        );
        address boundedAddr = kiltAddr2Addr[_kiltAccount];
        // the maybe new KiltAccount can not be bounded to other address
        require(
            boundedAddr == _msgSender() || boundedAddr == address(0),
            "Kilt Address already Bounded"
        );

        _addProof(_msgSender(), _kiltAccount, _proofCid, _requestHash);

        emit UpdateProof(_msgSender(), _kiltAccount, _requestHash, _proofCid);
    }

    function _addProof(
        address _user,
        bytes32 _kiltAccount,
        string memory _proofCid,
        bytes32 _requestHash
    ) internal {
        // bind to kilt account
        kiltAddr2Addr[_kiltAccount] = _user;

        // add proofCid to proofs
        proofs[_user][_requestHash] = _proofCid;
    }
}
