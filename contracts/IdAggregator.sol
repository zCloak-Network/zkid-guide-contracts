// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./common/AuthControl.sol";
import "./interfaces/IRegistry.sol";


/**
 * @title Where zCloak-worker submit the verification result
 * @notice each node worker will commit the hash first and 
 * then reveal the answer later.
 */
contract Aggregator is Properties, AuthControl {

    enum Stage {
        // TODO: need this status?
        NotStart,
        Commit,
        Reveal,
        Close
    }

    struct VerifyOutput {
        bytes32 rootHash;
        bool isPassed;
        bytes32 attester;
    }

    struct RoundDetails {
        Stage stage;
        mapping(address => bytes32) commits;
        mapping(Stage => uint32) submissions;
        mapping(bytes32 => VerifyOutput) outputId;
        mapping(bytes32 => uint32) outputVotes;
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

    // user => requestHash => rounddetails
    mapping(address => mapping(bytes32 => RoundDetails)) rounds;
    // user => requestHash => attester => isPassed
    mapping(address => mapping(bytes32 => mapping(bytes32 => bool))) zkCredential;
    // worker => VerifyRecord
    mapping(address => VerifyRecord) workerActivities;

    event Commit(address cOwner, bytes32 requestHash, address worker, bytes32 commitHash);
    event CommitEnd(address cOwner, bytes32 requestHash);

    event Reveal(address cOwner, bytes32 requestHash, address worker, bytes32 attester, bool isPassed);
    event Canonical(address cOwner, bytes32 requestHash, bytes32 attester, bool isPassed);

    // limit the caller within worker set
    function submit_commit(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _commitHash
    ) auth() public {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(round.stage != Stage.Reveal, "In Reveal, commits not accepted.");
        // initialize
        if (round.stage == Stage.NotStart) {
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


    function submit_reveal(
        address _cOwner,
        bytes32 _requestHash,
        bytes32 _rootHash,
        bool _verifyRes,
        bytes32 _attester
    ) auth() public {
        RoundDetails storage round = rounds[_cOwner][_requestHash];
        require(round.stage == Stage.Reveal, "Must be in reveal stage");
        // the worker can and only can submit only once
        VerifyRecord storage record = workerActivities[msg.sender];
        require(record.submits[_cOwner][_requestHash] != 0, "Can not submit twice the same task");
        // check commit hash
        // commitHash = hash(rootHash + isPassed + attesterAccount + workerAddress)
        bytes32 hash = keccak256(abi.encodePacked(_rootHash, _verifyRes, _attester, msg.sender));
        
        if (hash != round.commits[msg.sender]) {
            // TODO: punish with reputation
            return;
        }

        bytes32 outputHash = keccak256(abi.encodePacked(_rootHash, _verifyRes, _attester));
        // initialize output id
        if (round.outputId[outputHash].rootHash == bytes32(0)) {
             VerifyOutput storage output = round.outputId[outputHash];
             output.rootHash = _rootHash;
             output.isPassed = _verifyRes;
             output.attester = _attester;
        }

        // vote for the result
        round.outputVotes[outputHash] += 1;
        
        emit Reveal(_cOwner, _requestHash, msg.sender, _attester, _verifyRes);
        uint32 threshold = round.threshold;
        if (round.outputVotes[outputHash] >= threshold) {
            round.stage = Stage.Close;
            zkCredential[_cOwner][_requestHash][_attester] = _verifyRes;

            emit Canonical(_cOwner, _requestHash, _attester, _verifyRes);
        }
    }

}
 