// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ReadAccessController.sol";
import "../utils/Addresses.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../common/Properties.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/IChecker.sol";
import "../interfaces/IRawChecker.sol";

contract MockReadAccessController is ReadAccessController {
    
    using AddressesUtils for AddressesUtils.Addresses;
    
    event DeleteRule(address token, bytes32 cType, bytes32 programHash, bool expectedResult, uint256 customThreshold);

    constructor(address _registry) ReadAccessController(_registry) {
        registry = IRegistry(_registry);
    }

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

    function readProjectArrayLength(
        bytes32 _cTypeAllowed,
        bytes32 _programAllowed,
        bool _expectedResult
    ) view public onlyOwner returns (uint256) {
        AddressesUtils.Addresses storage projects = restriction[_cTypeAllowed][_programAllowed][_expectedResult];
        return projects.getArrayLength();
    }
    
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
}