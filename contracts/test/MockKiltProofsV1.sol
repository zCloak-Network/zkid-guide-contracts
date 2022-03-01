// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../KiltProofsV1.sol";

// TODO: needs update
contract MockKiltProofsV1 is KiltProofsV1 {

    constructor(IRegistry _registry) KiltProofsV1(_registry) {
        registry = _registry;
    }

}