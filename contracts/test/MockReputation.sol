// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ReputationV1.sol";
import "../utils/AddressesUtils.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MockReputation is Reputation {

    using SafeMath for uint256;
    using AddressesUtils for AddressesUtils.Addresses;

    constructor(address _registry) Reputation(_registry) {}

    function getCReputations(
        bytes32 requestHash,
        address keeper
    ) public view returns (int128) {
        return communityReputations[requestHash][keeper];
    }

    function getIRutationPoint(
        bytes32 requestHash,
        address keeper
    ) public view returns (int128) {
        IndividualReputation storage ireputation = individuals[requestHash][keeper];
        return ireputation.individualReputation;
    }

    function getKeeperTotalReputations(
        address keeper
    ) public view returns (int128) {
        return reputations[keeper];
    }


}