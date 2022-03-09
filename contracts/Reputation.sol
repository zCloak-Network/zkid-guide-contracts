// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC1363Receiver.sol";

/**
 * @title record the reputation point for worker and reward pool
 */
 
contract Reputation is IERC1363Receiver {

    // project => token => amount
    mapping(address => mapping(address => uint256)) currentReward;

    // worker => token => withdrawable
    mapping(address => mapping(address => uint256)) withdrawables;

    // worker => reputation point(could be less then zero)
    mapping(address => int256) totalReputations;

    // to record how many tasks that worker has done which
    // attached with no reward.
    //TODO: any way that user could ddos worker??
    mapping(address => int256) communityReputations;


    // TODO: add any access control to limit the caller 
    // to ReadAccessController contract instance?
    function onTransferReceived(
        address _operator, // the ReadAccessController
        address _sender, // the project 
        uint256 _amount,
        bytes calldata data
    ) override external returns (bytes4) {
        if (msg.sender != _operator) {
            // wrong sender
            return bytes4(0);
        }

        

    



    }



}