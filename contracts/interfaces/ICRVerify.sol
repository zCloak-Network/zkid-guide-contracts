// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICRVerify {
    function submitCommit(
        address cOwner,
        bytes32 requestHash,
        bytes32 commitHash
    ) external;

    function submitReveal(
        address cOwner,
        bytes32 requestHash,
        bytes32 cType,
        bytes32 rootHash,
        bool verifyRes,
        bytes32 attester
    ) external;

    function getOutputHash(bytes32 _rootHash, bool _isPassed, bytes32 _attester) external view returns (bytes32);

}