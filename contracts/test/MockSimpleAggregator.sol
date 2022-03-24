// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../SimpleAggregator.sol";
import "../utils/AddressesUtils.sol";
import "../utils/Bytes32sUtils.sol";

contract MockSimpleAggregator is SimpleAggregator {

    using AddressesUtils for AddressesUtils.Addresses;
    using Bytes32sUtils for Bytes32sUtils.Bytes32List;

    constructor(address _registry) SimpleAggregator(_registry) {}

    function getMinSubmission(
        address _user,
        bytes32 _requestHash
    ) public view returns (uint32) {
        return minSubmission[_user][_requestHash];
    }

    // TODO:add more getter function
}