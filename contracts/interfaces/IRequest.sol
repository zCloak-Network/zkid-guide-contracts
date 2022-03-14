// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRequest {

    function updateRequestStatus(bytes32 requestHash, bool isInService) external;
}