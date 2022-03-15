// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRequest {

    function initializeRequest(
        bytes32 cType,
        string calldata fieldName,
        bytes32 programHash,
        bool expResult,
        bytes32 attester
    ) external;

    // if a requestHash has been initialized
    function exists(bytes32 requestHash) external view returns (bool);

    function getRequestHash(
        bytes32 cType,
        string calldata fieldName,
        bytes32 programHash,
        bool expResult,
        bytes32 attester
    ) external returns (bytes32);
}