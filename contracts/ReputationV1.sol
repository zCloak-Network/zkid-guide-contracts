// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IERC1363Receiver.sol";
import "./interfaces/IERC1363.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IReputation.sol";
import "./common/AuthControl.sol";
import "./common/Properties.sol";
import "./utils/AddressesUtils.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title record the reputation point for worker and reward pool
 */

contract Reputation is Context, ReentrancyGuard, Properties, AuthControl, IERC1363Receiver, IReputation {
    int128 constant PUNISH = -2;
    int128 constant REWARD = 1;

    using SafeMath for uint256;
    using AddressesUtils for AddressesUtils.Addresses;

    struct IndividualReputation {
        int128 individualReputation;
        // token => claimedReward
        mapping(address => uint256) claimedAmount;
    }

    IRegistry registry;

    // requestHash => token => totalReward
    mapping(bytes32 => mapping(address => uint256)) rewardPool;

    // requstHash => token list
    mapping(bytes32 => AddressesUtils.Addresses) payments;

    // requestHash => totalPoint
    // totalPoint could not be negative
    mapping(bytes32 => uint256) totalPoints;

    // requestHash => worker => Reputation
    mapping(bytes32 => mapping(address => IndividualReputation)) individuals;

    // worker => reputation point(could be less then zero)
    mapping(address => int128) reputations;

    // to record how many tasks that worker has done which
    // attached with no reward.
    // TODO: change this to requestHash => worker => rcommunityRputation
    mapping(bytes32 => mapping(address => int128)) communityReputations;

    // emit when keeper add successfully add token
    // Add(token, keeper)
    event Add(address token, address executor);

    // emit when worker successfully claim the reward
    // Claim(token, amount, worker)
    event Claim(address token, uint256 amount, address claimer);

    event BatchClaim(bytes32 requestHash, address claimer);
    // emit when worker submit the wrong result
    // Punish(requestHash, worker, individualPoints, communityPoints, totalPoints)
    event Punish(
        bytes32 requestHash,
        address worker,
        int128 individualPoints,
        int128 communityPoints,
        int128 totalPoints
    );
    // emit when worker submit the wrong result
    // Reward(requestHash, worker, individualPoints, communityPoints, totalPoints)
    event Reward(
        bytes32 requestHash,
        address worker,
        int128 individualPoints,
        int128 communityPoints,
        int128 totalPoints
    );

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // batch add token for reward keeper
    function batchAdd(bytes32 _requestHash, address[] memory _token) public {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];
        for (uint256 i = 0; i < _token.length; i++) {
            tokens._push(_token[i]);
            emit Add(_token[i], _msgSender());
        }
    }

    // add token as verification reward
    function addToken(bytes32 _requestHash, address _token) public {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];
        tokens._push(_token);
        emit Add(_token, _msgSender());
    }

    // batch claim the multiple-token verification reward
    function batchClaim(bytes32 _requestHash) public {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];
        for (uint256 i = 0; i < tokens.length(); i++) {
            address token = tokens.element(i);
            IndividualReputation storage individualR = individuals[
                _requestHash
            ][_msgSender()];
            uint256 withdraw = _withdrawable(individualR, _requestHash, token);

            // should check all reward status
            if (withdraw == 0) {
                continue;
            }

            _claim(token, _msgSender(), withdraw, individualR);
        }

        emit BatchClaim(_requestHash, _msgSender());
    }

    // claim the verification reward of the specific token
    function claimToken(bytes32 _requestHash, address _token)
        public
        returns (bool)
    {
        IndividualReputation storage individualR = individuals[_requestHash][
            _msgSender()
        ];
        uint256 withdraw = _withdrawable(individualR, _requestHash, _token);
        if (withdraw == 0) {
            // nothing to claim
            return false;
        }

        return _claim(_token, _msgSender(), withdraw, individualR);
    }

    function _claim(
        address _token,
        address _claimer,
        uint256 _withdraw,
        IndividualReputation storage _individualR
    ) nonReentrant internal returns (bool) {
        _individualR.claimedAmount[_token].add(_withdraw);
        IERC1363(_token).transfer(_claimer, _withdraw);

        emit Claim(_token, _withdraw, _claimer);

        return true;
    }

    function withdrawable(
        bytes32 _requestHash,
        address _token,
        address _worker
    ) public view returns (uint256) {
        IndividualReputation storage individualR = individuals[_requestHash][
            _worker
        ];

        return _withdrawable(individualR, _requestHash, _token);
    }

    // TODO: extract common part of punish and reward
    function punish(bytes32 _requestHash, address _worker)
        public
        override
        auth
    {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];
        IndividualReputation storage individualR = individuals[_requestHash][
            _worker
        ];
        // this requestHash is not rewarded by any project
        if (tokens.length() == 0) {
            communityReputations[_requestHash][_worker] += PUNISH;
        } else {
            // rewarded by projects
            individualR.individualReputation += PUNISH;
        }

        reputations[_worker] += PUNISH;

        emit Punish(
            _requestHash,
            _worker,
            individualR.individualReputation,
            communityReputations[_requestHash][_worker],
            reputations[_worker]
        );
    }

    function reward(bytes32 _requestHash, address _worker)
        public
        override
        auth
    {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];
        IndividualReputation storage individualR = individuals[_requestHash][
            _worker
        ];
        // this requestHash is not rewarded by any project
        if (tokens.length() == 0) {
            communityReputations[_requestHash][_worker] += REWARD;
        } else {
            // rewarded by projects
            individualR.individualReputation += REWARD;
        }
        // update total reputation
        reputations[_worker] += REWARD;

        emit Reward(
            _requestHash,
            _worker,
            individualR.individualReputation,
            communityReputations[_requestHash][_worker],
            reputations[_worker]
        );
    }

    function transformReputation(bytes32 _requestHash) public {
        AddressesUtils.Addresses storage tokens = payments[_requestHash];

        if (tokens.length() > 0) {
            int128 communtiyR = communityReputations[_requestHash][_msgSender()];
            individuals[_requestHash][_msgSender()]
                .individualReputation += communtiyR;
            communityReputations[_requestHash][_msgSender()] = 0;
        }
        // TODO: add event
    }

    // TODO: add any access control to limit the caller
    // to ReadAccessController contract instance?
    // modify clients
    function onTransferReceived(
        address _operator, // the ReadAccessController
        address _sender, // rac
        uint256 _amount,
        bytes calldata data // requstHash
    ) external override returns (bytes4) {
        address readGateway = registry.addressOf(
            Properties.CONTRACT_READ_GATEWAY
        );
        if (_operator != readGateway) {
            // wrong sender
            return bytes4(0);
        }
        
        bytes32 requestHash;
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            requestHash := mload(add(ptr, 0x100))
        }

        rewardPool[requestHash][_msgSender()].tryAdd(_amount);
        // TODO: add event
    }

    // compute the amount of reward that a worker can withdraw
    function _withdrawable(
        IndividualReputation storage _individualR,
        bytes32 _requestHash,
        address _token
    ) internal view returns (uint256) {
        // can not claim reward if reputation is negative
        int256 keeperReputation = _individualR.individualReputation;
        if (keeperReputation <= 0) {
            return 0;
        }

        uint256 rewardPerPoint = rewardPool[_requestHash][_token] /
            totalPoints[_requestHash];
        // rewardPerPoint * reputation
        uint256 totalToWithdraw = rewardPerPoint * uint256(keeperReputation);

        (bool _isLegal, uint256 withdrawableAmount) = totalToWithdraw.trySub(
            _individualR.claimedAmount[_token]
        );

        uint256 maxAmount = rewardPool[_requestHash][_token];

        // can not exceed amount of tken in the reward pool
        uint256 withdraw;
        if (withdrawableAmount <= maxAmount) {
            withdraw = withdrawableAmount;
        } else {
            withdraw = maxAmount;
        }

        return withdraw;
    }
}
