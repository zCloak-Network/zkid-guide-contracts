// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./interfaces/IRegistry.sol";
import "./SimpleAggregator.sol";
import "./interfaces/IAuthority.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleAggregatorAuth is IAuthority, Properties, Ownable {
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
                (_sig == SimpleAggregator.submit.selector);
        }

        address readGateway = registry.addressOf(
            Properties.CONTRACT_READ_GATEWAY
        );
        return (_src == readGateway) && (_sig == SimpleAggregator.isValid.selector);
    }
}