// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ProofStorage.sol";

// TODO: needs update
contract MockKiltProofsV1 is ProofStorage {

    constructor(IRegistry _registry) ProofStorage(_registry) {
        registry = _registry;
    }

}