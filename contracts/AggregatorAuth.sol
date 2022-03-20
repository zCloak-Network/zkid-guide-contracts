// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./interfaces/IAuthority.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/ICRVerify.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Control the CRAggregator's function calls.
 * @notice worker can submitCommit and submitReveal
 *  and ReadAccessController can read isValid
 */

contract AggregatorAuth is Ownable, IAuthority, Properties {
    uint256 workerCount;

    IRegistry registry;
    mapping(address => bool) public isWorker;

    event AddWorker(address worker);

    constructor(address[] memory _whitelist, address _registry) {
        registry = IRegistry(_registry);
        for (uint256 i = 0; i < _whitelist.length; i++) {
            isWorker[_whitelist[i]] = true;
            workerCount++;
            emit AddWorker(_whitelist[i]);
        }
    }

    function addWorker(address _worker) public onlyOwner {
        isWorker[_worker] = true;
        workerCount++;

        emit AddWorker(_worker);
    }

    // worker can invoke addVerification
    // Oracle can read through isPassed and isValid
    function canCall(
        address _src,
        address _dst,
        bytes4 _sig
    ) public view override returns (bool) {
        if (isWorker[_src]) {
            return
                (_sig == ICRVerify.submitCommit.selector) ||
                (_sig == ICRVerify.submitReveal.selector);
        }

        address readGateway = registry.addressOf(
            Properties.CONTRACT_READ_GATEWAY
        );
        return (_src == readGateway) && (_sig == IChecker.isValid.selector);
    }
}
