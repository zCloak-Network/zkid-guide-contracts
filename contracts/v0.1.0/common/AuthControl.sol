// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/IAuthority.sol';

contract DSAuthEvents {
    event LogSetAuthority (address indexed authority);
    event LogSetOwner     (address indexed owner);
}

/**
 * @title DSAuth
 * @dev The DSAuth contract is reference implement of https://github.com/dapphub/ds-auth
 * But in the isAuthorized method, the src from address(this) is remove for safty concern.
 */
contract AuthControl is DSAuthEvents {
    IAuthority   public  authority;
    address      public  owner;

    constructor() {
        owner = msg.sender;
        emit LogSetOwner(msg.sender);
    }

    function setOwner(address owner_)
        public
        auth
    {
        owner = owner_;
        emit LogSetOwner(owner);
    }

    function setAuthority(address _authority)
        public
        auth
    {
        authority = IAuthority(_authority);
        emit LogSetAuthority(_authority);
    }

    modifier auth {
        require(isAuthorized(msg.sender, msg.sig), "Auth: you can not pass authorization verification");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function isAuthorized(address src, bytes4 sig) internal view returns (bool) {
        if (src == owner) {
            return true;
        } else if (authority == IAuthority(address(0))) {
            return false;
        } else {
            return authority.canCall(src, address(this), sig);
        }
    }
}