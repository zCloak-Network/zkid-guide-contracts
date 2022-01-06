// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./common/Properties.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";
import "./interfaces/IRawChecker.sol";
import "./utils/Addresses.sol";


contract KiltOracle is Properties, Ownable, IChecker {

    using AddressesUtils for AddressesUtils.Addresses;

    IRegistry public registry;

    // cType => programHash => expectResult => registered projects
    mapping(bytes32 => mapping(bytes32 => mapping(bool => AddressesUtils.Addresses))) internal restriction;

    mapping(address => uint256) public customThreshold;

    // TODO: remove after testing: add DeleteRule event
    event AddRule(address token, bytes32 cType, bytes32 programHash, bool expectedResult, uint256 customThreshold);
    event DeleteRule(address token, bytes32 cType, bytes32 programHash, bool expectedResult, uint256 customThreshold);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // modifier accessible(bytes32 _cType, bytes32 _programHash, bool _expResult, address _project) {
    //     require(isRegistered(_cType, _programHash, _expResult, _project));
    //     _;
    // }

    // TODO: remove after testing
    /// @param _num array index number
    function judge(
        uint _num,
        address _project,
        bytes32 _cTypeAllowed,
        bytes32 _programAllowed,
        bool _expectedResult
    ) view public onlyOwner returns (bool) {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        return projects.judgeEqual(_num, _project);
    }

    // TODO: remove after testing
    /// @dev this function just for checking address array in struct storage
    /// @param _num array index number
    function readAddress(
        uint256 _num,
        bytes32 _cTypeAllowed,
        bytes32 _programAllowed,
        bool _expectedResult
    ) view public onlyOwner returns (address) {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        return projects.getAddress(_num);
    }

    // TODO: remove after testing
    /// @dev this function just for checking index mapping in struct storage
    function readIndex(
        address _project,
        bytes32 _cTypeAllowed,
        bytes32 _programAllowed,
        bool _expectedResult
    ) view public onlyOwner returns (uint256) {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        return projects.getIndex(_project);
    }

    // TODO: remove after testing
    function readProjectArrayLength(
        bytes32 _cTypeAllowed,
        bytes32 _programAllowed,
        bool _expectedResult
    ) view public onlyOwner returns (uint256) {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        return projects.getArrayLength();
    }

    function addRule(
        address _project,
        bytes32 _cTypeAllowed, 
        bytes32 _programAllowed,
        bool _expectedResult,
        uint256 _customThreshold
    ) onlyOwner public {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        require(projects._addAddress(_project), "Fail to pass addAddress in AddressUtils");
        customThreshold[_project] = _customThreshold;
        emit AddRule(_project, _cTypeAllowed, _programAllowed, _expectedResult, _customThreshold);
    
    }

    // TODO: remove after testing deleteAddress
    function deleteRule(
        address _project,
        bytes32 _cTypeAllowed, 
        bytes32 _programAllowed,
        bool _expectedResult
    ) onlyOwner public {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        require(projects._deleteAddress(_project), "Fail to pass deleteAddress in AddressUtils");
        customThreshold[_project] = 0;
        uint256 cThreshold = customThreshold[_project];
        emit DeleteRule(_project, _cTypeAllowed, _programAllowed, _expectedResult, cThreshold);
    }

    // helper function for restriction (due to syntax limits)
    function isRegistered(bytes32 _cType, bytes32 _programHash, bool _expResult, address _project) public view returns (bool) {
        AddressesUtils.Addresses storage addresses = restriction[_cType][_programHash][_expResult];
        return addresses.exists(_project);
    }

    function threshold(address _project) public view returns (uint256) {
        uint defaultThreshold = registry.uintOf(Properties.UINT_APPROVE_THRESHOLD);
        uint cThreshold = customThreshold[_project];
        if ( cThreshold > defaultThreshold) {
            return cThreshold;
        } else {
            return defaultThreshold;
        }
    }

    // TODO: add modifiert
    function isValid(address _who, bytes32 _cType, bytes32 _programHash, bool _expectResult) override public view returns (bool) {
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

}