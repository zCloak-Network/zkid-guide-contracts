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

/**
 * @title the commit/reaveal aggregator.
 * Where zCloak-worker submit the verification result
 * @notice each node worker will commit the hash first and 
 * then reveal the answer later.
 */
contract CRAggregator is Properties, AuthControl, IChecker {

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

    struct VerifyRecord {
        // use this to record the # of success txs the worker
        // has submitted.
        // we use the hash(address+nonce) as the salt value 
        // in the commit stage, to avoid the freeloading attack.
        uint256 nonce;
        // user => requestHash => commitHash
        mapping(address => mapping(bytes32 => bytes32)) submits;
    }
    
    // registry where we query global settings
    IRegistry public registry;

    // user => requestHash => roundDetails
    mapping(address => mapping(bytes32 => RoundDetails)) rounds;

    // user => requestHash => Final
    mapping(address => mapping(bytes32 => Final)) zkCredential;

    // user => requestHash => rootHash
    mapping(address => mapping(bytes32 => bytes32)) public addr2Root;

    // rootHash => user
    mapping(bytes32 => address) did;

    // worker => VerifyRecord
    mapping(address => VerifyRecord) workerActivities;

    event Commit(address cOwner, bytes32 requestHash, address worker, bytes32 commitHash);
    event CommitEnd(address cOwner, bytes32 requestHash);

    event Reveal(address cOwner, bytes32 requestHash, address worker, bytes32 attester, bool isPassed);
    event Canonical(address cOwner, bytes32 requestHash, bool isPassed);


    constructor(
        address _registry
    ) {
        registry = IRegistry(_registry);
    }


    // limit the caller within worker set
    function submitCommit(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _commitHash
    ) auth() public {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(round.stage == Stage.Created || round.stage == Stage.Commit, "commits are now not accepted.");
        
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
        round.commits[msg.sender] = _commitHash;
        round.submissions[Stage.Commit] += 1;
        // increase nonce
        VerifyRecord storage record = workerActivities[msg.sender];
        record.submits[_cOwner][_requestHash] = _commitHash;

        emit Commit(_cOwner, _requestHash, msg.sender, _commitHash);

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
    ) auth() public {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(round.stage == Stage.Reveal, "Err: Must be in reveal stage");
        IReputation reputation = IReputation(registry.addressOf(Properties.CONTRACT_REPUTATION));
        // the worker can and only can submit only once
        VerifyRecord storage record = workerActivities[msg.sender];
        require(record.submits[_cOwner][_requestHash] != 0, "Err: Can not submit twice the same task");
        // check commit hash
        // commitHash = hash(rootHash + isPassed + attesterAccount + workerAddress)
        bytes32 hash = keccak256(abi.encodePacked(_rootHash, _verifyRes, _attester, msg.sender));

             
        if (hash != round.commits[msg.sender]) {
            reputation.punish(_requestHash, msg.sender);
            return;
        }

        // check request metadata
       {
            IRequest request = IRequest(registry.addressOf(Properties.CONTRACT_REQUEST));
            (bytes32 cType, bytes32 attester) = request.requestMetadata(_requestHash);

            require((_cType == cType) && (_attester == attester), "Err: rootHash is wrong.");
       }
   
        bytes32 outputHash = keccak256(abi.encodePacked(_rootHash, _verifyRes, _attester));
        Bytes32sUtils.Bytes32List storage outputIds = round.outputIds;
        // initialize output id, it's only initlaized once
        if (round.outputId[outputHash].rootHash == bytes32(0)) {
            VerifyOutput storage output = round.outputId[outputHash];
            output.rootHash = _rootHash;
            output.isPassed = _verifyRes;
            output.attester = _attester;
            // add new element
            outputIds._addBytes32(outputHash);
        }

        // update votes
        Vote storage vote = round.votes[outputHash];
        vote.workers._addAddress(msg.sender);
        vote.voteCount += 1;

        // reward before reveal finished
        reputation.reward(_requestHash, msg.sender);

        uint32 threshold = round.threshold;
        if (vote.voteCount >= threshold) {
            _agree(_requestHash, _cOwner, _verifyRes, _rootHash, reputation, outputHash, round);
        }

        emit Reveal(_cOwner, _requestHash, msg.sender, _attester, _verifyRes);
    }

    // reach the final result
    function _agree(bytes32 _requestHash, address _cOwner, bool _verifyRes, bytes32 _rootHash, IReputation _reputation, bytes32 _outputHash, RoundDetails storage _round) internal {
        _round.stage = Stage.Close;
        zkCredential[_cOwner][_requestHash].isPassed = _verifyRes;
        zkCredential[_cOwner][_requestHash].agreeAt = block.timestamp;
        // TODO: how to manage kyc info updates?
        {
            require(did[_rootHash] == address(0) || did[_rootHash] == _cOwner, "Err: rootHash already claimed");

            addr2Root[_cOwner][_requestHash] = _rootHash;
            did[_rootHash] = _cOwner;
        }

        // handle punishment
        Bytes32sUtils.Bytes32List storage outputIds = _round.outputIds;
        for(uint i = 0; i < outputIds.length(); i++) {
            if (outputIds.internalBytes32s[i] != _outputHash) {
                Vote storage badVote = _round.votes[outputIds.internalBytes32s[i]];
                for (uint j = 0; j < badVote.workers.length(); j++) {
                    // punish the malicious keeper and add bonus to the phisherman
                    _reputation.punish(_requestHash, badVote.workers.addresses[j]);
                    _reputation.reward(_requestHash, msg.sender);
                }
            }
        }

        emit Canonical(_cOwner, _requestHash, _verifyRes);
    }

    function isValid(address _who, bytes32 _requestHash) override external view returns (bool) {
        return zkCredential[_who][_requestHash].isPassed;
    }



}
 