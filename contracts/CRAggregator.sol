// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./common/AuthControl.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IReputation.sol";
import "./interfaces/ICRVerify.sol";
import "./interfaces/IRequest.sol";
import "./utils/AddressesUtils.sol";
import "./utils/Bytes32sUtils.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title the commit/reaveal aggregator.
 * Where zCloak-worker submit the verification result
 * @notice each node worker will commit the hash first and
 * then reveal the answer later.
 */
contract CRAggregator is Context, Properties, AuthControl, IChecker, ICRVerify {
    using AddressesUtils for AddressesUtils.Addresses;
    using Bytes32sUtils for Bytes32sUtils.Bytes32List;

    enum Stage {
        Created,
        Commit,
        Reveal,
        Close
    }

    struct VerifyOutput {
        bytes32 rootHash;
        bool isPassed;
        bytes32 attester;
    }

    // record the voted worker and the vote count in total
    struct Vote {
        AddressesUtils.Addresses workers;
        uint32 voteCount;
    }

    struct Final {
        bool isPassed;
        // when to reach the final result
        uint256 agreeAt;
    }

    struct RoundDetails {
        Stage stage;
        // stage1: worker => commitHash
        mapping(address => bytes32) commits;
        // stage status => submissions counts
        mapping(Stage => uint32) submissions;
        // stage2: fingerprint hash of the verification (outputId) => verifyDetail
        // outputId = hash(rootHash, isPassed, attesterAccount)
        mapping(bytes32 => VerifyOutput) outputId;
        Bytes32sUtils.Bytes32List outputIds;
        // outputHash => Vote
        mapping(bytes32 => Vote) votes;
        uint32 minCommitSubmissions;
        uint32 threshold;
    }

    // registry where we query global settings
    IRegistry public registry;

    // user => requestHash => roundDetails
    mapping(address => mapping(bytes32 => RoundDetails)) rounds;

    // user => requestHash => Final
    mapping(address => mapping(bytes32 => Final)) zkCredential;

    // rootHash => user
    mapping(bytes32 => address) did;

    // worker => cOwner => requestHash => isSubmittedReveal
    mapping(address => mapping(address => mapping(bytes32 => bool))) revealSubmissions;

    event Commit(
        address cOwner,
        bytes32 requestHash,
        address worker,
        bytes32 commitHash
    );
    event CommitEnd(address cOwner, bytes32 requestHash);

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

    // limit the caller within worker set
    function submitCommit(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _commitHash
    ) public override auth {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(
            round.stage == Stage.Created || round.stage == Stage.Commit,
            "commits are now not accepted."
        );

        // remove the expired credential
        if (block.timestamp > zkCredential[_cOwner][_requestHash].agreeAt) {
            zkCredential[_cOwner][_requestHash].isPassed = false;
            zkCredential[_cOwner][_requestHash].agreeAt = 0;
        }

        // initialize
        if (round.stage == Stage.Created) {
            round.stage = Stage.Commit;
            // round config
            uint32 minCommit = registry.uint32Of(Properties.UINT32_MIN_COMMIT);
            uint32 threshold = registry.uint32Of(Properties.UINT32_THRESHOLD);
            round.minCommitSubmissions = minCommit;
            round.threshold = threshold;
        }

        // enable worker to change its commit in Commit stage
        round.commits[_msgSender()] = _commitHash;
        round.submissions[Stage.Commit] += 1;

        emit Commit(_cOwner, _requestHash, _msgSender(), _commitHash);

        // if the # of submission reach the `minSubmissions`, change the stage status
        // to reveal stage.
        if (round.submissions[Stage.Commit] >= round.minCommitSubmissions) {
            round.stage = Stage.Reveal;
            emit CommitEnd(_cOwner, _requestHash);
        }
    }

    // TODO: punish those who only submitCommit but not submitReveal
    function submitReveal(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _cType,
        bytes32 _rootHash,
        bool _verifyRes,
        bytes32 _attester
    ) public override auth {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(round.stage == Stage.Reveal, "Err: Must be in reveal stage");
        IReputation reputation = IReputation(
            registry.addressOf(Properties.CONTRACT_REPUTATION)
        );
        // the worker can and only can submit only once
        require(
            !revealSubmissions[_msgSender()][_cOwner][_requestHash],
            "Err: Can not submit twice the same task"
        );
        // check commit hash
        // commitHash = hash(rootHash + isPassed + attesterAccount + workerAddress)
        bytes32 hash = keccak256(
            abi.encodePacked(_rootHash, _verifyRes, _attester, _msgSender())
        );

        if (hash != round.commits[_msgSender()]) {
            reputation.punish(_requestHash, _msgSender());
            return;
        }

        // check request metadata
        {
            IRequest request = IRequest(
                registry.addressOf(Properties.CONTRACT_REQUEST)
            );
            (bytes32 cType, bytes32 attester) = request.requestMetadata(
                _requestHash
            );

            require(
                (_cType == cType) && (_attester == attester),
                "Err: rootHash is wrong."
            );
        }

        bytes32 outputHash = getOutputHash(_rootHash, _verifyRes, _attester);
        Bytes32sUtils.Bytes32List storage outputIds = round.outputIds;
        // initialize output id, it's only initlaized once
        if (round.outputId[outputHash].rootHash == bytes32(0)) {
            VerifyOutput storage output = round.outputId[outputHash];
            output.rootHash = _rootHash;
            output.isPassed = _verifyRes;
            output.attester = _attester;
            // add new element
            outputIds._push(outputHash);
        }

        // update votes
        Vote storage vote = round.votes[outputHash];
        vote.workers._push(_msgSender());
        vote.voteCount += 1;

        // reward before reveal finished
        reputation.reward(_requestHash, _msgSender());
        // add reveal count
        round.submissions[Stage.Reveal] += 1;
        // add keeper reaveal submission record
        revealSubmissions[_msgSender()][_cOwner][_requestHash] = true;

        uint32 threshold = round.threshold;
        if (vote.voteCount >= threshold) {
            _agree(
                _requestHash,
                _cOwner,
                _verifyRes,
                _rootHash,
                reputation,
                outputHash,
                round
            );
        }

        emit Verifying(
            _cOwner,
            _requestHash,
            _msgSender(),
            _attester,
            _verifyRes
        );
    }

    // reach the final result
    function _agree(
        bytes32 _requestHash,
        address _cOwner,
        bool _verifyRes,
        bytes32 _rootHash,
        IReputation _reputation,
        bytes32 _outputHash,
        RoundDetails storage _round
    ) internal {
        // close the submission channel
        _round.stage = Stage.Close;
        zkCredential[_cOwner][_requestHash].isPassed = _verifyRes;
        zkCredential[_cOwner][_requestHash].agreeAt = block.timestamp;
        // TODO: how to manage kyc info updates?
        {
            require(
                did[_rootHash] == address(0) || did[_rootHash] == _cOwner,
                "Err: rootHash already claimed"
            );
            did[_rootHash] = _cOwner;
        }

        // handle punishment
        Bytes32sUtils.Bytes32List storage outputIds = _round.outputIds;
        for (uint256 i = 0; i < outputIds.length(); i++) {
            if (outputIds.element(i) != _outputHash) {
                Vote storage badVote = _round.votes[outputIds.element(i)];
                for (uint256 j = 0; j < badVote.workers.length(); j++) {
                    // punish the malicious keeper and add bonus to the phisherman
                    _reputation.punish(
                        _requestHash,
                        badVote.workers.element(j)
                    );
                    _reputation.reward(_requestHash, _msgSender());
                }
            }
        }

        emit Canonical(_cOwner, _requestHash, _verifyRes);
    }

    function isValid(address _who, bytes32 _requestHash)
        external
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
    ) public pure override returns (bytes32 oHash) {
        oHash = keccak256(abi.encodePacked(_rootHash, _isPassed, _attester));
    }
}
