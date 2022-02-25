// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IMeter {
    // return (expirationTime, PayInWhichToken, perVisitPayAmount)
    // charge in time: return (someCertainValue, address(0), 0)
    // charge by times: return (0, tokenAddress, someCertainAmount)
    function meter() external view returns (uint256, address, uint256);
}