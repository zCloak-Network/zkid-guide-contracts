// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./common/AuthControl.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IERC1363.sol";
import "./interfaces/IERC1363Receiver.sol";
import "./interfaces/IRequest.sol";
import "./utils/AddressesUtils.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title ReadAccessController serves as:
 * 1. Rule Registry for the project who needs users' on-chain
 *    protected kyc info.
 * 2. management of request info and request status
 * 3. The read gateway for the kyc info.
 * @notice worker can submitCommit and submitReveal
    and ReadAccessController can read isValid
 */
contract ReadAccessController is
    Context,
    Properties,
    AuthControl,
    IChecker,
    IRequest,
    IERC1363Receiver
{
    using AddressesUtils for AddressesUtils.Addresses;

    IRegistry public registry;

    struct Meter {
        uint256 perVisitFee;
        // using native token like ETH if token is address(0)
        // do not use this to determine the access
        address token;
    }

    // requestHash => RequestDetail
    mapping(bytes32 => IRequest.RequestDetail) public requestInfo;
    // requestHash => project => meter
    mapping(bytes32 => mapping(address => Meter)) public applied;

    // zCloak whitelist project, usually opened for zCloak demo app
    mapping(address => bool) public superior;

    event AddRule(
        address project,
        bytes32 requestHash,
        address token,
        uint256 perVisitFee
    );
    event DeleteRule(address project, bytes32 requestHash);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // TODO: revoked by owner and KiltProofV1
    function initializeRequest(RequestDetail memory _d) external override auth {
        bytes32 requestHash = getRequestHash(_d);
        // must be the first time to add info
        require(
            requestInfo[requestHash].cType == bytes32(0),
            "Already Initlaized"
        );

        // start to initlaize
        // modify request
        requestInfo[requestHash] = _d;
        // TODO: add event
    }

    function applyRequest(
        bytes32 _requestHash,
        address _project,
        address _token,
        uint256 _perVisitFee
    ) public onlyOwner {
        Meter storage meter = applied[_requestHash][_project];
        meter.token = _token;
        meter.perVisitFee = _perVisitFee;
        // TODO: add event
    }

    function superAuth(address _internal, bool granted) public onlyOwner {
        superior[_internal] = granted;
    }

    function getRequestHash(RequestDetail memory _requestDetail)
        public
        pure
        override
        returns (bytes32 rHash)
    {
        rHash = keccak256(
            abi.encodePacked(
                _requestDetail.cType,
                _requestDetail.fieldName,
                _requestDetail.programHash,
                _requestDetail.expResult,
                _requestDetail.attester
            )
        );
    }

    // To check if a requestHash has been initlized
    function exists(bytes32 _requestHash)
        external
        view
        override
        returns (bool)
    {
        return requestInfo[_requestHash].cType != bytes32(0);
    }

    modifier accessAllowed(address _caller, bytes32 _requestHash) {
        require(
            applied[_requestHash][_caller].perVisitFee != 0 ||
                superior[_caller] ||
                _caller == address(this),
            "No Access"
        );
        _;
    }

    // read data from aggregator
    function isValid(address _who, bytes32 _requestHash)
        external
        view
        override
        accessAllowed(_msgSender(), _requestHash)
        returns (bool)
    {
        IChecker aggregator = IChecker(
            registry.addressOf(Properties.CONTRACT_AGGREGATOR)
        );
        return aggregator.isValid(_who, _requestHash);
    }

    function requestMetadata(bytes32 _requestHash)
        public
        view
        override
        returns (bytes32 cType, bytes32 attester)
    {
        RequestDetail storage request = requestInfo[_requestHash];
        return (request.cType, request.attester);
    }

    // project will use `transferFromAndCall(user, rac, amount, data)` or `transferAndCall(rac, amount, data)`
    // _msgSender() should be token
    function onTransferReceived(
        address _operator, // project
        address _sender, // user/project
        uint256 _amount,
        bytes calldata _data
    ) external override returns (bytes4) {
        // TODO: deserialize data?
        // 1. where to get the user address
        //  `_sender` or retrieve it from `data`
        // 2. specify the revoked function in data or 'hardcode' it?
        address cOwner;
        bytes32 requestHash;
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            cOwner := mload(add(ptr, 0xa4))
            requestHash := mload(add(ptr, 0xc4))
        }

        Meter storage meter = applied[requestHash][_operator];
        address tokenExp = meter.token;
        uint256 perVisit = meter.perVisitFee;

        require(
            tokenExp == _msgSender() || _amount >= perVisit,
            "Wrong Payment"
        );

        // transfer reward token to reward pool
        address rewardPool = registry.addressOf(Properties.CONTRACT_REWARD);
        // _data must be requestHash
        require(IERC1363(tokenExp).transferAndCall(rewardPool, _amount, _data));

        bool res = this.isValid(cOwner, requestHash);
        // charge if the user is verified true
        if (res) {
            return IERC1363Receiver(this).onTransferReceived.selector;
        } else {
            return bytes4(0);
        }
    }
}
