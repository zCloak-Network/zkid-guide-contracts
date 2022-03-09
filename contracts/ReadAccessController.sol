// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./common/Properties.sol";
import "./common/AuthControl.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IRawChecker.sol";
import "./interfaces/IERC1363Receiver.sol";
import "./interfaces/IMeter.sol";
import "./utils/AddressesUtils.sol";


// Rule Registry for the project who needs users' on-chain s
// protected  kyc info.
// And this contract serves as the read gateway for the kyc info.
contract ReadAccessController is Properties, AuthControl, IChecker, IERC1363Receiver {

    using AddressesUtils for AddressesUtils.Addresses;

    IRegistry public registry;
    IChecker public aggregator;

    // reward pool 
    address pool;

    struct RequestDetail {
        bytes32 cType;
        string fieldName;
        bytes32 programHash;
        bool expResult;
        bytes32 attester;
    }

    // requestHash => RequestDetail
    mapping(bytes32 => RequestDetail) public requestInfo;
    // requestHash => project => meter
    mapping(bytes32 => mapping(address => address)) public applied;

    event AddRule(address project, bytes32 requestHash, address meter);
    event DeleteRule(address project, bytes32 requestHash);




    // TODO: revoked by owner and KiltProofV1
    function initializeRequest(
        bytes32 _cType,
        string calldata _fieldName,
        bytes32 _programHash,
        bool _expResult,
        bytes32 _attester
    ) auth() public {

        bytes32 requestHash = getRequestHash(_cType, _fieldName, _programHash, _expResult, _attester);
        // must be the first time to add info
        require(requestInfo[requestHash].cType == bytes32(0), "Already Initlaized");

        // start to initlaize
          // modify request
        RequestDetail storage request = requestInfo[requestHash];
        request.cType = _cType;
        request.fieldName = _fieldName;
        request.programHash = _programHash;
        request.expResult = _expResult;
        request.attester = _attester;
    }

    function applyRequest(bytes32 _requestHash, address _project, address _meter) onlyOwner() public {
        applied[_requestHash][_project] = _meter;
    }


    function getRequestHash(
        bytes32 _cType,
        string calldata _fieldName,
        bytes32 _programHash,
        bool _expResult,
        bytes32 _attester
    ) public pure returns (bytes32 rHash) {
        rHash = keccak256(abi.encodePacked(_cType, _fieldName, _programHash, _expResult, _attester));
    }

    function accessible(address _operator, bytes32 _requestHash) public view returns (bool) {
        
    }

    constructor(
        address _registry,
        address _aggregator
    ) public {
        registry = IRegistry(_registry);
        aggregator = IChecker(_aggregator);
    }


    modifier accessAllowed(address _caller, bytes32 _requestHash) {
         require(applied[_requestHash][_caller] != address(0) || _caller == address(this), "No Access");
         _;
    }          

    
    // read data from aggregator
    function isValid(address _who, bytes32 _requestHash) accessAllowed(msg.sender, _requestHash) override public view returns (bool) {
        return aggregator.isValid(_who, _requestHash);
    }


    function onTransferReceived(
        address _operator, // the msg sender
        address _sender, // user
        uint256 _amount,
        bytes calldata data
    ) override external returns (bytes4) {
        if (msg.sender != _operator) {
            // wrong sender
            return bytes4(0);
        }
 
        // TODO: deserialize data?
        // 1. where to get the user address 
        //  `_sender` or retrieve it from `data`
        // 2. specify the revoked function in data or 'hardcode' it?
        bytes32 requestHash;
        address token;
           assembly {
               let ptr := mload(0x40)
                calldatacopy(ptr, 0, calldatasize())
                token := mload(add(ptr, 0x80)) 
                requestHash := mload(add(ptr, 0x100))
           }

            IMeter meter = IMeter(applied[requestHash][_operator]);
            (uint expiration, address tokenExp, uint perVisit) = meter.meter();
            
            require(token == tokenExp, "Wrong Payment");
            // if the project is not charged on time
            if (expiration == 0) {
                // make sure this visit is paid correctly
                require(_operator == token, "Wrong token kind");
                require(_amount >= perVisit, "Fee to low");
            } else {
                // charge on time
                require(expiration >= block.timestamp, "Expired!");
            }

            // transfer reward token to reward pool
            

           bool res = isValid(_sender, requestHash);

           if (res) {
               return IERC1363Receiver(this).onTransferReceived.selector;
           } else {
               return bytes4(0);
           }

    }
}