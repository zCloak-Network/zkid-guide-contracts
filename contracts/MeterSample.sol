// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IMeter.sol";

/**
 * @title How other project is gonna use the onchain kyc info 
 */
contract MeterSample is IMeter {

    uint256 public expiration;
    uint256 public perVisitFee;
    address public token;


    constructor(
        uint256 _expiration,
        uint256 _perVisitFee,
        address _token
    ) {
        expiration = _expiration;
        perVisitFee = _perVisitFee;
        token = _token;
    }

    function meter() override public view returns (uint256, address, uint256) {
        return(expiration, token, perVisitFee);
    }     


}