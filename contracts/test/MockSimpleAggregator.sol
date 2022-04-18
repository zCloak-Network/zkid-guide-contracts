// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../SimpleAggregator.sol";
import "../utils/AddressesUtils.sol";
import "../utils/Bytes32sUtils.sol";

contract MockSimpleAggregator is SimpleAggregator {

    using AddressesUtils for AddressesUtils.Addresses;
    using Bytes32sUtils for Bytes32sUtils.Bytes32List;

    constructor(
        address _registry
    ) SimpleAggregator(_registry) {}

    function getMinSubmission(
        address user,
        bytes32 requestHash
    ) public view returns (uint32) {
        return minSubmission[user][requestHash];
    }

    // function getKeeperSubmissions(
    //     address keeper,
    //     address cOwner,
    //     bytes32 requestHash
    // ) public view returns (bytes32) {
    //     return keeperSubmissions[cOwner][requestHash];
    // }

    function getVoterAddress(
        address user,
        bytes32 requestHash,
        bytes32 outputHash,
        uint256 num
    ) public view returns (address) {
        AddressesUtils.Addresses storage voters = votes[user][
            requestHash
        ][outputHash].keepers;

        return voters.element(num);
    }

    function getVoterIndex(
        address user,
        bytes32 requestHash,
        bytes32 outputHash,
        address keeper
    ) public view returns (uint256) {
        AddressesUtils.Addresses storage voters = votes[user][
            requestHash
        ][outputHash].keepers;

        return voters.getAddressesIndex(keeper);
    }

    function getVoteCount(
        address user,
        bytes32 requestHash,
        bytes32 outputHash
    )public view returns (uint32) {
        return votes[user][requestHash][outputHash].voteCount;
    }
   
    function getBytes32ListOutputHash(
        address user,
        bytes32 requestHash,
        uint256 num
    ) public view returns (bytes32) {
        Bytes32sUtils.Bytes32List storage oHashNum = outputHashes[user][requestHash];
        return oHashNum.element(num);
    }

    function getFinalResult(
        address user,
        bytes32 requestHash
    ) public view returns (bool) {
        Final storage finalRes = zkCredential[user][requestHash];
        return finalRes.isPassed;
    }

    function getFinalTimestamp(
        address user,
        bytes32 requestHash
    ) public view returns (uint256) {
        Final storage finalRes = zkCredential[user][requestHash];
        return finalRes.agreeAt;
    }

    function getFinalOHash(
        address user,
        bytes32 requestHash
    ) public view returns (bytes32) {
        Final storage finalRes = zkCredential[user][requestHash];
        return finalRes.outputHash;
    }

    function getDid(
        bytes32 rootHash
    ) public view returns (address) {
        return did[rootHash];
    }
}