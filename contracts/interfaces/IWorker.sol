pragma solidity ^0.8.0;

interface IWorker {
    function isWorker(address _worker) external view returns (bool);
}