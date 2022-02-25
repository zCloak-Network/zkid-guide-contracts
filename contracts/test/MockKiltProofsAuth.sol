// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../KiltProofsAuth.sol";

contract MockKiltProofsAuth is KiltProofsAuth {

    constructor(
        address[] memory _whitelist,
        address _registry
    ) KiltProofsAuth(_whitelist, _registry) {}
    
    /// @dev add three getter function
    function getWRITE_ADD_V_SIG() public view returns (bytes4) {
        return WRITE_ADD_V_SIG;
    }

    function getREAD_IS_VALID_SIG() public view returns (bytes4) {
        return READ_IS_VALID_SIG;
    }

    function getREAD_IS_PASSED_SIG() public view returns (bytes4) {
        return READ_IS_PASSED_SIG;
    }
}