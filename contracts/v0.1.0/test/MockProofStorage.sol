// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ProofStorage.sol";
import "../interfaces/IRequest.sol";

contract MockProofStorage is ProofStorage {
    constructor(IRegistry _registry) ProofStorage(_registry) {}

    function getProofCid(address user, bytes32 requestHash)
        public
        view
        returns (string memory)
    {
        return fatProofs[user][requestHash].proofCid;
    }

    function getCalcResult(
        address _user,
        bytes32 _requestHash,
        uint128 _index
    ) public view returns (uint128) {
        return fatProofs[_user][_requestHash].calcResult[_index];
    }
}
