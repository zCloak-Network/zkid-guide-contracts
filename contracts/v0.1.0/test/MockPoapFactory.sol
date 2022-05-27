// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../PoapFactory.sol";

contract MockPoapFactory is PoapFactory {

    constructor(address _registry) PoapFactory( _registry) {}

    /// @dev using factory contract to control poap's pause and unpause
    /// @notice current for test
    function pause(address _poap) public onlyOwner {
        ZCloakPoap poap = ZCloakPoap(_poap);
        poap.pause();
    }

    /// @notice current for test
    function unpause(address _poap) public onlyOwner {
        ZCloakPoap poap = ZCloakPoap(_poap);
        poap.unPause();
    }
}