// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1363.sol";

contract MockERC1363 is ERC1363 {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10 ** uint(decimals()));
    }
}