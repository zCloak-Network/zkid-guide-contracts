// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../KiltProofsV1.sol";

contract MockKiltProofsV1 is KiltProofsV1 {

    constructor(IRegistry _registry) KiltProofsV1(_registry) {
        registry = _registry;
    }

    function getApprovedRootHash(
        address _dataOwner,
        bytes32 _cType,
        bytes32 _rootHash
    ) view public auth() returns(uint256) {
        Credential storage _credential = certificate[_dataOwner][_cType];
        return (_credential.approvedRootHash[_rootHash]);
    }

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