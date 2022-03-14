// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC1363Receiver.sol";
import "./interfaces/IERC1363.sol";
import "./interfaces/IReward.sol";
import "./common/AuthControl.sol";
import "./utils/AddressesUtils.sol";

/**
 * @title record the reputation point for worker and reward pool
 */
 
contract Reputation is IERC1363Receiver, IReward, AuthControl {

    int128 constant PUNISH = -2;
    int128 constant REWARD = 1;

    using SafeMath for uint256;
    using AddressesUtils for AddressesUtils.Addresses;

    struct Claim {
        int128 reputationPoint;
        // token => claimedReward
        mapping(address => uint256) claimedAmount;
    }


    // requestHash => token => totalReward
    mapping(bytes32 => mapping(address => uint256)) rewardPool; 

    // requstHash => token list
    mapping(bytes32 => AddressesUtils.Addresses) clients;
   
    // requestHash => token => totalPoint
    // totalPoint could not be negative
    mapping(bytes32 => mapping(address => uint256)) totalPoints;

    // requestHash => worker => Reputation
    mapping(bytes32 => mapping(address => Claim)) claimRecord;

    // worker => reputation point(could be less then zero)
    mapping(address => int128) totalReputations;

    // to record how many tasks that worker has done which
    // attached with no reward.
    //TODO: any way that user could ddos worker??
    mapping(address => int128) communityReputations;

    // emit when worker successfully claim the reward
    // Withdraw(token, amount, worker)
    event Withdraw(address token, uint256 amount, address claimer);
    // emit when worker submit the wrong result
    // Punish(requestHash, worker, individualPoints, communityPoints, totalPoints)
    event Punish(bytes32 requestHash, address worker, int128 individualPoints, int128 communityPoints, int128 totalPoints);
    // emit when worker submit the wrong result
    // Reward(requestHash, worker, individualPoints, communityPoints, totalPoints)
    event Reward(bytes32 requestHash, address worker, int128 individualPoints, int128 communityPoints, int128 totalPoints);
    
    // TODO: add globalFlag to control the claim action in 
    function claimToken(bytes32 _requestHash, address _token) public {
        Claim storage claim = claimRecord[_requestHash][msg.sender];
        uint withdraw = _withdrawable(claim, _requestHash, _token);

        if (withdraw == 0) {
            // nothing to claim
            return;
        }


        claim.claimedAmount[_token].add(withdraw);
        IERC1363(_token).transfer(msg.sender, withdraw);
        
        emit Withdraw(_token, withdraw, msg.sender);
    }


    function withdrawable(bytes32 _requestHash, address _token, address _worker) public view returns (uint256) {
        Claim storage claim = claimRecord[_requestHash][_worker];

        return _withdrawable(claim, _requestHash, _token);
    }



    // TODO: extract common part of punish and reward
    function punish(bytes32 _requestHash, address _worker) auth() override public {
        AddressesUtils.Addresses storage tokens = clients[_requestHash];

        if (tokens.addresses.length == 0) {
            communityReputations[_worker] += PUNISH;
            totalReputations[_worker] += PUNISH;
            emit Punish(_requestHash, _worker, 0, communityReputations[_worker], totalReputations[_worker]);
            return;
        }
        
        Claim storage claim = claimRecord[_requestHash][_worker];
        claim.reputationPoint += PUNISH;

        emit Punish(_requestHash, _worker, claim.reputationPoint, communityReputations[_worker], totalReputations[_worker]);
    }


    function reward(bytes32 _requestHash, address _worker) auth() override public {
        AddressesUtils.Addresses storage tokens = clients[_requestHash];

        if (tokens.addresses.length == 0) {
            communityReputations[_worker] += REWARD;
            totalReputations[_worker] += REWARD;
            emit Punish(_requestHash, _worker, 0, communityReputations[_worker], totalReputations[_worker]);
            return;
        }
        
        Claim storage claim = claimRecord[_requestHash][_worker];
        claim.reputationPoint += REWARD;

        emit Reward(_requestHash, _worker, claim.reputationPoint, communityReputations[_worker], totalReputations[_worker]);
    
    }



    // TODO: add any access control to limit the caller 
    // to ReadAccessController contract instance?
    // modify clients
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



    // compute the amount of reward that a worker can withdraw
    function _withdrawable(Claim storage claim, bytes32 _requestHash, address _token) internal view returns (uint256) {
        // can not claim reward if reputation is negative 
        int workerPoint = claim.reputationPoint;
        if (workerPoint <= 0) {
            return 0;
        }
        
        uint256 rewardPerPoint = rewardPool[_requestHash][_token] / totalPoints[_requestHash][_token];
        // rewardPerPoint * totalPoint
        uint256 totalToWithdraw = rewardPerPoint * uint256(workerPoint);

        (bool _isLegal, uint withdrawbleAmount) = totalToWithdraw.trySub(claim.claimedAmount[_token]);

        return withdrawbleAmount;
    }




}