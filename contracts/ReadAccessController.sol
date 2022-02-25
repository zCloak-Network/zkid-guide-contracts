// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./common/Properties.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IRawChecker.sol";
import "./interfaces/IERC677TransferReceiver.sol";
import "./interfaces/IMeter.sol";
import "./utils/Addresses.sol";


// Rule Registry for the project who needs users' on-chain s
// protected  kyc info.
// And this contract serves as the read gateway for the kyc info.
contract ReadAccessController is Properties, Ownable, IChecker, IERC677TransferReceiver {

    using AddressesUtils for AddressesUtils.Addresses;

    IRegistry public registry;

    struct Requirement {
        // ctype => AttesterAddress
        mapping(bytes32 => bytes32) trustedAttester;
        // ctype => programHash => expectResult
        mapping(bytes32 => mapping(bytes32 => bool)) conditions;
        // where to check access permission and the billing rule
        // address(0) if the project has no permission to read
        address meter;
    }


    // TODO: if we use the universal threshold instead?
    mapping(address => uint256) public customThreshold;

    // project address => Requirement
    mapping(address => Requirement) public rules;

    // project address => rule adder
    // only the 'owner' of the project could add rule
    mapping(address => address) public controller;

    // TODO: remove after testing: add DeleteRule event
    event AddRule(address token, bytes32 cType, bytes32 programHash, bool expectedResult);
    event DeleteRule(address token, bytes32 cType, bytes32 programHash, bool expectedResult);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }


    function addRule(
        address _project,
        bytes32 _cTypeAllowed, 
        bytes32 _programAllowed,
        bytes32 _attester,
        bool _expectedResult
    ) public {
        // To check if the requirements have not come into effect
        // or the msg.sender is the real owner of the _project
        require(rules[_project].meter == address(0) || 
            controller[_project] == msg.sender, "No Access to rule modification");
        
        rules[_project].trustedAttester[_cTypeAllowed] = _attester;
        rules[_project].conditions[_cTypeAllowed][_programAllowed] = _expectedResult;
        emit AddRule(_project, _cTypeAllowed, _programAllowed, _expectedResult);
    
    }


    function approve() public onlyOwner {
        
    }

    // TODO: do we need to allow project to customize the threshold
    function threshold(address _project) public view returns (uint256) {
        uint defaultThreshold = registry.uintOf(Properties.UINT_APPROVE_THRESHOLD);
        uint cThreshold = customThreshold[_project];
        if ( cThreshold > defaultThreshold) {
            return cThreshold;
        } else {
            return defaultThreshold;
        }
    }

    function isValid(address _who, bytes32 _cType, bytes32 _programHash, bool _expectResult) override public view returns (bool) {
        require(rules[msg.sender].meter != address(0) || msg.sender == address(this), "No Access");
        IRawChecker proofContract = IRawChecker(registry.addressOf(Properties.CONTRACT_MAIN_KILT));
        (bytes32 rootHash, uint256 count) = proofContract.credentialProcess(_who, _cType); 
        uint256 threshold = threshold(msg.sender);
        if (count < threshold) {
            return false;
        }

        uint256 passCount = proofContract.verificationProcess(_who, _cType, _programHash, rootHash, _expectResult);
        
        if (passCount >= threshold) {
            return true;
        } else {
            return false;
        }
    }


    function tokenFallback(
        address _from,
        uint256 _amount,
        bytes calldata data
    ) override external returns (bool) {
        IMeter meter = IMeter(rules[msg.sender].meter);
        (uint expiration, address token, uint perVisit) = meter.meter();
        // if the project is not charged on time
        if (expiration == 0) {
            // make sure this visit is paid correctly
            require(msg.sender == token, "Wrong token kind");
            require(_amount >= perVisit, "Fee to low");
        } else {
            // charge on time
            require(expiration >= block.timestamp, "Expired!");
        }

        // TODO: check to function to call, limit it to `isValid`
        (bool result, bytes memory response) = address(this).call(data);
        // TODO: wrong logic.
        return result;
        

    }
}