// SPDX-License-Identifier: MIT

// This is for Worker
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWorker.sol";

contract Whitelist is Ownable, IWorker {

    uint256 workerCount;
    mapping(address => bool) public override isWorker;

    event AddWorker(address worker);

    function addWorker(address _worker) public onlyOwner {
        isWorker[_worker] = true;
        workerCount++;
  
        emit AddWorker(_worker);
    }

}