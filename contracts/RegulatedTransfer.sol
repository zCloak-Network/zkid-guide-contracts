// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Properties.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IChecker.sol";


contract RegulatedTransfer is Properties {

    IRegistry public registry;

    event RTransfer(address token, address from, address to, uint256 amount, bytes32 programHash);


    constructor(address _registry) {
        registry = IRegistry(_registry);
    }

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

        require(
            IChecker(_checker).isValid(_to, _cType) &&
            IChecker(_checker).isPassed(_to, _programHash, _cType),
            "Receiver has not been verified"
        );

        if (IERC20(_erc20).transferFrom(msg.sender, _to, _amount)) {
            emit RTransfer(_erc20, msg.sender, _to, _amount, _programHash);
        }

        

        
    }

}