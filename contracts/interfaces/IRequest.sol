// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRequest {

    struct RequestDetail {
        bytes32 cType;
        uint128[] fieldName;
        bytes32 programHash;
        bytes32 attester;
    }

    function initializeRequest(
        RequestDetail calldata _requestDetail
    ) external;

    // if a requestHash has been initialized
    function exists(bytes32 requestHash) external view returns (bool);

    function getRequestHash(
        RequestDetail calldata _requestDetail
    ) external returns (bytes32);

    // return (cType, expResult, attester)
    function requestMetadata(bytes32 _requestHash) external view returns (RequestDetail memory);
}