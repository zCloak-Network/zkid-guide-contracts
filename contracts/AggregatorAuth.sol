// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IAuthority.sol";
import "./interfaces/IRegistry.sol";
import "./common/Properties.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Control the CRAggregator's function calls.
 * @notice worker can submitCommit and submitReveal
 *  and ReadAccessController can read isValid
 */
 //TODO: logic needs update.
contract AggregatorAuth is Ownable, IAuthority, Properties {

    // TODO: need update
    bytes4 constant READ_IS_VALID_SIG = bytes4(keccak256("isValid(address,bytes32)"));

    uint256 workerCount;

    IRegistry registry;
    mapping(address => bool) public isWorker;

    event AddWorker(address worker);

    constructor(address[] memory _whitelist, address _registry) {
        registry = IRegistry(_registry);
        for (uint i = 0; i < _whitelist.length; i++) {
            isWorker[_whitelist[i]] = true;
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
        address _src, address _dst, bytes4 _sig
    ) override public view returns (bool) {
        return ( isWorker[_src] && _sig == READ_IS_VALID_SIG );
    }

}