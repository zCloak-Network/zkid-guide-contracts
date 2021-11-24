// SPDX-License-Identifier: MIT

// This is for Worker
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {

    uint256 workerCount;
    mapping(address => bool) public isWorker;

    event AddWorker(address worker);

    function addWorker(address _worker) public onlyOwner {
        isWorker[_worker] = true;
        workerCount++;
  
        emit AddWorker(_worker);
    }

}