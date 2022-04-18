// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ReadAccessController.sol";
import "../interfaces/IRequest.sol";

contract MockRAC is ReadAccessController {
    constructor(address _registry) ReadAccessController(_registry) {}

    function getFieldName(
        bytes32 rHash
    ) public view returns (uint128[] memory) {
        return requestInfo[rHash].fieldNames;
    }
}