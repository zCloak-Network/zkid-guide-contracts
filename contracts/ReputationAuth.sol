// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./interfaces/IAuthority.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IReputation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Control the SimpleAggregator's function calls.
 * @notice ReputationV1 contract can reward and punish keeper
 */

contract ReputationAuth is Ownable, IAuthority, Properties {
    IRegistry registry;

    event AddWorker(address worker);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // worker can invoke addVerification
    // Oracle can read through isPassed and isValid
    function canCall(
        address _src,
        address _dst,
        bytes4 _sig
    ) public view override returns (bool) {
        address aggregator = registry.addressOf(Properties.CONTRACT_AGGREGATOR);
        return
            (_src == aggregator) &&
            ((_sig == IReputation.reward.selector) ||
                (_sig == IReputation.punish.selector));
    }
}
