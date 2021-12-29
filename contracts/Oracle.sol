// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Properties.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IChecker.sol";
import "./utils/Addresses.sol";


contract Oracle is Properties, Ownable, IOracle, IChecker {

    using AddressesUtils for AddressesUtils.Addresses;

    IRegistry public registry;

    // cType => programHash => expectResult => registered projects
    mapping(bytes32 => mapping(bytes32 => mapping(bool => AddressesUtils.Addresses))) internal restriction;

    mapping(address => uint256) public customThreshold;


    event RTransfer(address token, address from, address to, uint256 amount, bytes32 programHash);
    event AddRule(address token, address checker, bytes32 cType, bytes32 programHash, bool expectedResult);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // modifier accessible(bytes32 _cType, bytes32 _programHash, bool _expResult, address _project) {
    //     require(isRegistered(_cType, _programHash, _expResult, _project));
    //     _;
    // }

    function addRule(
        address _project,
        address _checker,
        bytes32 _cTypeAllowed, 
        bytes32 _programAllowed,
        bool _expectedResult
    ) onlyOwner public {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        require(projects._addAddress(_project), "Fail to pass addAddress in AddressUtils");

        emit AddRule(_project, _checker, _cTypeAllowed, _programAllowed, _expectedResult);
    
    }


    // helper function for restriction (due to syntax limits)
    function isRegistered(bytes32 _cType, bytes32 _programHash, bool _expResult, address _project) public view returns (bool) {
        AddressesUtils.Addresses storage addresses = restriction[_cType][_programHash][_expResult];
        return addresses.exists(_project);
    } 

    function threshold(address _project) public override view returns (uint256) {
        uint defaultThreshold = registry.uintOf(Properties.UINT_APPROVE_THRESHOLD);
        uint cThreshold = customThreshold[_project];
        if ( cThreshold > defaultThreshold) {
            return cThreshold;
        } else {
            return defaultThreshold;
        }
    }

    function isValid(address _who, bytes32 _cType) public view override returns (bool) {
        IChecker proofContract = IChecker(registry.addressOf(Properties.CONTRACT_MAIN_KILT));
        return proofContract.isValid(_who, _cType);
    }

    function isPassed(
        address _who, 
        bytes32 _cType,
        bytes32 _programHash
    ) public override view returns (bool) {
         IChecker proofContract = IChecker(registry.addressOf(Properties.CONTRACT_MAIN_KILT));
         return proofContract.isPassed(_who, _cType, _programHash);
    }

}