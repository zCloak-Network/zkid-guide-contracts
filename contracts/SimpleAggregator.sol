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
        // outputHash,
        bytes32 outputHash;
    }

    struct Output {
        bytes32 rootHash;
        uint128[] calcOutput;
        bool isPassed;
        bytes32 attester;
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
    // kepper => userAddress => requestHash => outputHash
    mapping(address => mapping(address => mapping(bytes32 => bytes32))) keeperSubmissions;

    // outputHash => Output
    mapping(bytes32 => Output) outputs;

    event Verifying(
        address cOwner,
        bytes32 requestHash,
        address worker,
        bytes32 outputHash,
        bytes32 attester,
        bool isPassed,
        uint128[] calcResult
    );
    event Canonical(address cOwner, bytes32 requestHash, bytes32 outputHash);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    function submit(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _cType,
        bytes32 _rootHash,
        bool _verifyRes,
        bytes32 _attester,
        uint128[] memory _calcOutput
    ) public auth {
        // one keeper can only submit once for same request task
        bytes32 outputHash = getOutputHash(
            _rootHash,
            _calcOutput,
            _verifyRes,
            _attester
        );
        require(
            !hasSubmitted(_msgSender(), _cOwner, _requestHash),
            "Err: keeper can only submit once to the same request task"
        );

        // the request task has not been finished
        require(
            zkCredential[_cOwner][_requestHash].agreeAt == 0,
            "Err: Request task has already been finished"
        );

        // check user's attestation whether the atterster which keeper requests to kilt or not
        require(
            checkAttestation(_requestHash, _cType, _attester),
            "Err: this attestation does not match one which provided by user"
        );

        // initialize the min submission requirement
        if (minSubmission[_cOwner][_requestHash] == 0) {
            uint32 threshold = registry.uint32Of(Properties.UINT32_THRESHOLD);
            minSubmission[_cOwner][_requestHash] = threshold;
        }

        // record keeper's submission
        keeperSubmissions[_msgSender()][_cOwner][_requestHash] = outputHash;

        // modify vote
        Vote storage vote = votes[_cOwner][_requestHash][outputHash];
        vote.keepers._push(_msgSender());
        vote.voteCount += 1;

        // add outputHash
        if (!outputHashes[_cOwner][_requestHash].exists(outputHash)) {
            outputHashes[_cOwner][_requestHash]._push(outputHash);
        }

        // reward keeper
        IReputation reputation = IReputation(
            registry.addressOf(Properties.CONTRACT_REPUTATION)
        );
        reputation.reward(_requestHash, _msgSender());

        emit Verifying(_cOwner, _requestHash, _msgSender(), outputHash, _attester, _verifyRes, _calcOutput);

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
        zkCredential[_cOwner][_requestHash].outputHash = _outputHash;

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

        emit Canonical(_cOwner, _requestHash, _outputHash);
    }

    function zkID(address _who, bytes32 _requestHash)
        public
        view
        override
        returns (bool, uint128[] memory)
    {
        bytes32 outputHash = zkCredential[_who][_requestHash].outputHash;
        uint128[] memory calcOutput = outputs[outputHash].calcOutput;
        bool isPassed = zkCredential[_who][_requestHash].isPassed;
        return (isPassed, calcOutput);
    }

    // todo: make the parameter to be a struct
    function getOutputHash(
        bytes32 _rootHash,
        uint128[] memory _calcOutput,
        bool _isPassed,
        bytes32 _attester
    ) public pure returns (bytes32 oHash) {
        oHash = keccak256(
            abi.encodePacked(_rootHash, _calcOutput, _isPassed, _attester)
        );
    }

    function checkAttestation(
        bytes32 _requestHash,
        bytes32 _cType, // fetched from kilt
        bytes32 _attester // fetched from kilt
    ) public view returns (bool) {
        IRequest request = IRequest(
            registry.addressOf(Properties.CONTRACT_REQUEST)
        );
        IRequest.RequestDetail memory d = request.requestMetadata(_requestHash);

        return ((_attester == d.attester) && (_cType == d.cType));
    }

    function hasSubmitted(
        address _keeper,
        address _cOwner,
        bytes32 _requestHash
    ) public view returns (bool) {
        return keeperSubmissions[_keeper][_cOwner][_requestHash] != bytes32(0);
    }

    // true - the task is finished
    // false - not finished, keeper still can submit result
    function isFinished(address _cOwner, bytes32 _requestHash)
        public
        view
        returns (bool)
    {
        return zkCredential[_cOwner][_requestHash].agreeAt != 0;
    }
}
