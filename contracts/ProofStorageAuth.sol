// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./interfaces/IRegistry.sol";
import "./ReadAccessController.sol";
import "./interfaces/IAuthority.sol";

contract ProofStorageAuth is Properties, IAuthority {
    IRegistry public registry;

    constructor (address _registry) {
        registry = IRegistry(_registry);
    }

    // user can invoke addProof
    function canCall(
        address _src,
        address _dst,
        bytes4 _sig
    ) public view override returns (bool) {
        address proofStorage = registry.addressOf(Properties.CONTRACT_MAIN_KILT);
        return (_src == proofStorage) && (_sig == ReadAccessController.initializeRequest.selector);
    }
}