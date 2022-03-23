// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./common/AuthControl.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IReputation.sol";
import "./interfaces/IRequest.sol";
import "./utils/AddressesUtils.sol";
import "./utils/Bytes32sUtils.sol";

import "@openzeppelin/contracts/utils/Context.sol";

contract SimpleAggregator is Context, Properties, AuthControl, IChecker {
    using AddressesUtils for AddressesUtils.Addresses;
    using Bytes32sUtils for Bytes32sUtils.Bytes32List;

    struct VerifyOutput {
        bytes32 rootHash;
        bool isPassed;
        bytes32 attester;
    }

    // record the voted worker and the vote count in total
    struct Vote {
        AddressesUtils.Addresses keepers;
        uint32 voteCount;
    }

    struct Final {
        bool isPassed;
        // when to reach the final result
        uint256 agreeAt;
    }

    // registry where we query global settings
    IRegistry public registry;

    // config
    // user => requestHash => minSubmissionRequirement
    mapping(address => mapping(bytes32 => uint32)) minSubmission;

    // user => requestHash => outputHash => vote
    mapping(address => mapping(bytes32 => mapping(bytes32 => Vote))) votes;

    // user => requestHash => outputHashes
    mapping(address => mapping(bytes32 => Bytes32sUtils.Bytes32List)) outputHashes;
    // user => requestHash => Final
    mapping(address => mapping(bytes32 => Final)) zkCredential;

    // rootHash => user
    mapping(bytes32 => address) did;

    // To record the keepers' historical activities
    // kepper => requestHash => outputHash
    mapping(address => mapping(bytes32 => bytes32)) keeperSubmissions;

    event Verifying(
        address cOwner,
        bytes32 requestHash,
        address worker,
        bytes32 attester,
        bool isPassed
    );
    event Canonical(address cOwner, bytes32 requestHash, bool isPassed);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    function submit(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _cType,
        bytes32 _rootHash,
        bool _verifyRes,
        bytes32 _attester
    ) public auth {
        // one keeper can only submit once for same request task
        bytes32 outputHash = getOutputHash(_rootHash, _verifyRes, _attester);
        require(
            keeperSubmissions[_msgSender()][_requestHash] == bytes32(0),
            "Err: keeper can only submit once to the same request task"
        );

        // the request task has not been finished
        require(
            zkCredential[_cOwner][_requestHash].agreeAt == 0,
            "Err: Request task has already been finished"
        );

        // initialize the min submission requirement
        if (minSubmission[_cOwner][_requestHash] == 0) {
            uint32 threshold = registry.uint32Of(Properties.UINT32_THRESHOLD);
            minSubmission[_cOwner][_requestHash] = threshold;
        }

        // record keeper's submission
        keeperSubmissions[_msgSender()][_requestHash] = outputHash;

        // modify vote
        Vote storage vote = votes[_cOwner][_requestHash][outputHash];
        vote.keepers._push(_msgSender());
        vote.voteCount += 1;

        // add outputHash
        outputHashes[_cOwner][_requestHash]._push(outputHash);

        // reward keeper
        IReputation reputation = IReputation(
            registry.addressOf(Properties.CONTRACT_REPUTATION)
        );
        reputation.reward(_requestHash, _msgSender());

        if (vote.voteCount >= minSubmission[_cOwner][_requestHash]) {
            // reach the final result
            _agree(
                _requestHash,
                _cOwner,
                _verifyRes,
                _rootHash,
                reputation,
                outputHash
            );
        }
    }

    function _agree(
        bytes32 _requestHash,
        address _cOwner,
        bool _verifyRes,
        bytes32 _rootHash,
        IReputation _reputation,
        bytes32 _outputHash
    ) internal {
        zkCredential[_cOwner][_requestHash].isPassed = _verifyRes;
        zkCredential[_cOwner][_requestHash].agreeAt = block.timestamp;

        // modify did
        // TODO: how to manage rootHash update?
        require(
            did[_rootHash] == address(0) || did[_rootHash] == _cOwner,
            "Err: rootHash already claimed"
        );
        did[_rootHash] = _cOwner;

        // handle punishment
        Bytes32sUtils.Bytes32List storage outputHashList = outputHashes[
            _cOwner
        ][_requestHash];
        for (uint256 i = 0; i < outputHashList.length(); i++) {
            if (outputHashList.element(i) == _outputHash) {
                continue;
            }
            // punsish the malicious keepers
            AddressesUtils.Addresses storage badVoters = votes[_cOwner][
                _requestHash
            ][outputHashList.element(i)].keepers;

            for (uint256 j = 0; j < badVoters.length(); j++) {
                _reputation.punish(_requestHash, badVoters.element(j));
                _reputation.reward(_requestHash, _msgSender());
            }
        }

        emit Canonical(_cOwner, _requestHash, _verifyRes);
    }

    function isValid(address _who, bytes32 _requestHash)
        public
        view
        override
        returns (bool)
    {
        return zkCredential[_who][_requestHash].isPassed;
    }

    function getOutputHash(
        bytes32 _rootHash,
        bool _isPassed,
        bytes32 _attester
    ) public pure returns (bytes32 oHash) {
        oHash = keccak256(abi.encodePacked(_rootHash, _isPassed, _attester));
    }
}
