// SPDX-License-Identifier: MIT

/// This used to be the whitelist contract for filtering worker.

pragma solidity ^0.8.0;

import "./interfaces/IAuthority.sol";
import "./interfaces/IRegistry.sol";
import "./common/Properties.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract KiltProofsAuth is Ownable, IAuthority, Properties {

    bytes4 constant WRITE_ADD_V_SIG =  bytes4(keccak256("addVerification(address,bytes32,bytes32,bytes32,bool)"));
    bytes4 constant READ_IS_VALID_SIG = bytes4(keccak256("isValid(address,bytes32)"));
    bytes4 constant READ_IS_PASSED_SIG = bytes4(keccak256("isPassed(address,bytes32,bytes32)"));

    // TODO: remove after testing
    function getADD_V_SIG() public pure returns(bytes4) {
        return WRITE_ADD_V_SIG;
    }

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

    function isOracle(address _addr) public view returns (bool) {
        address oracle = registry.addressOf(Properties.CONTRACT_ORACLE);
        return _addr == oracle;
    } 

    // worker can invoke addVerification
    // Oracle can read through isPassed and isValid
     function canCall(
        address _src, address _dst, bytes4 _sig
    ) override public view returns (bool) {
        // TODO: console.log just for testing
        console.log("_sig == WRITE_ADD_V_SIG? ", _sig == WRITE_ADD_V_SIG);

        return ( isWorker[_src] && _sig == WRITE_ADD_V_SIG ) 
        || (isOracle(_src) && (_sig == READ_IS_VALID_SIG || _sig == READ_IS_PASSED_SIG));
    }

}