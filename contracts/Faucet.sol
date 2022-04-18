// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";

contract Faucet is Context {

    mapping(address => uint256) public claimed;

    uint256 constant MAX = 0.4 ether;
    uint256 constant CLAIM = 0.2 ether;

    event Claim(address who, uint256 amount);

    function claim() public {
        address claimer = _msgSender();
        require(claimed[claimer] <= MAX, "you have claimed too many");
        payable(claimer).transfer(CLAIM);

        emit Claim(claimer, CLAIM);
    }


    fallback() external payable { }
}