// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Properties.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";


contract RegulatedTransfer is Properties, Ownable {

    IRegistry public registry;


    // tokenAddress => cType => programHash  => expectResult(kilt)
    mapping(address => mapping(bytes32 => mapping(bytes32 => bool))) public restriction;


    event RTransfer(address token, address from, address to, uint256 amount, bytes32 programHash);
    event AddRule(address token, address checker, bytes32 cType, bytes32 programHash, bool expectedResult);

    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

    // self-checking
    function rTransfer(
        address _checker,
        address _erc20,
        address _to,
        uint256 _amount,
        bytes32 _cType,
        bytes32 _programHash
    ) public {
        
        if (_checker != registry.addressOf(CONTRACT_MAIN_KILT)) {
            // change later
            return;
        }

        require(
            IChecker(_checker).isValid(msg.sender, _cType) &&
            IChecker(_checker).isPassed(msg.sender, _programHash, _cType),
            "Sender has not been verified"
        );

        // require(
        //     IChecker(_checker).isValid(_to, _cType) &&
        //     IChecker(_checker).isPassed(_to, _programHash, _cType),
        //     "Receiver has not been verified"
        // );

        if (IERC20(_erc20).transferFrom(msg.sender, _to, _amount)) {
            emit RTransfer(_erc20, msg.sender, _to, _amount, _programHash);
        }
    }


    function addRule(
        address _erc20,
        address _checker,
        bytes32 _cTypeAllowed, 
        bytes32 _programAllowed, 
        bool _expectedResult
    ) onlyOwner public {
        restriction[_erc20][_cTypeAllowed][_programAllowed] = _expectedResult;
        
        if (IChecker(_checker).addService(
            address(this), // TODO: _erc20 or address(this)??
            _cTypeAllowed, 
            _programAllowed, 
            _expectedResult)
        ) {
            emit AddRule(_erc20, _checker, _cTypeAllowed, _programAllowed, _expectedResult);
        }
    }

}