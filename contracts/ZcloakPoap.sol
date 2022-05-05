// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IRegistry.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IChecker.sol";
import "./common/Properties.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZCloakPoap is ERC1155, Pausable, Ownable, Properties {
    using Address for address;

    IRegistry public registry;

    // poapId => totalSupply
    mapping(uint128 => uint128) totalSupply;
    // poapId => userAddr => balance
    mapping(uint128 => mapping(address => uint256)) public totalBalanceOf;
    /// poapIdentifier => userAddr => MyPoapId
    /// @notice current for test
    mapping(uint128 => mapping(address => uint256)) public myPoapId;
    
    // mint a class of nft
    event MintAClass(uint128 identifier, uint256 supply);

    /// burn a class of nft
    /// @notice current for test
    event BurnAClass(uint128 identifier, uint256 supply); 

    // mint a poap
    event MintPoap(uint128 poapId, address who, uint256 nftId);

    /// burn a poap
    /// @notice current for test
    event BurnPoap(uint128 poapId, address who, uint256 nftId);

    modifier isHuman(address _addr) {
        require( !_addr.isContract(), "Msg sender must be human being.");
        _;
    }

    // transfer is not allowed for did-based nfts.
    constructor(string memory _uri, address _registry) ERC1155(_uri) {
        registry = IRegistry(_registry);
        _pause();
    }

    // not allowed to be called by contract
    function claim() public isHuman(_msgSender()) {
        address who = _msgSender();
        
        // query requestHash that this contract mapping to
        IFactory factory = IFactory(registry.addressOf(Properties.CONTRACT_POAP_FACTORY));

        // get rac address to read user's final credential
        IChecker rac = IChecker(registry.addressOf(Properties.CONTRACT_READ_GATEWAY));

        // get requestHash
        bytes32 requestHash = IFactory(factory).getRequestHash(address(this));

        // get user's zkID
        (bool isValid, uint128[] memory outputs) = rac.zkID(who, requestHash);

        require(isValid, "zkCredential must be valid");
        
        // get poapId through outputs
        uint256 poapId = uint256(keccak256(abi.encode(outputs)));
        uint128 poapIdentifier = uint128(poapId >> 128);

        // get the pre-minted nft id
        uint256 nftId = getNftId(poapIdentifier);
        myPoapId[poapIdentifier][who] = nftId;

        // check if the user has owned the poap
        require(totalBalanceOf[poapIdentifier][who] == 0, "You have already minted");

        // mint poap to claimer
        _mint(who, nftId, 1, "");

        // increase totalSupply
        _mintAClass(poapIdentifier, who);

        emit MintPoap(poapIdentifier, who, nftId);
    }


    function getNftId(uint128 _poapId) public view returns (uint256) {
        uint256 poapIdU256 = uint256(_poapId) << 128;
        uint256 index = totalSupply[_poapId];

        return poapIdU256 + index;
    }


    function _mintAClass(uint128 _poapId, address _who) internal {
        //todo: use safe Add instead
        totalSupply[_poapId]++;
        totalBalanceOf[_poapId][_who]++;
        emit MintAClass(_poapId, totalSupply[_poapId]);
    }

    function _beforeTokenTransfer(
        address _operator,
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) internal virtual override {
        super._beforeTokenTransfer(_operator, _from, _to, _ids, _amounts, _data);
        // mint action do not need to be paused
        if (_from != address(0)) {
            require(!paused(), "ERC1155Pausable: token transfer while paused");
        }
    }

    function pause() public onlyOwner {
        super._pause();
    }

    function unPause() public onlyOwner {
        super._unpause();
    }

    /// @notice current for test
    function burnOne() public isHuman(_msgSender()) {
        address who = _msgSender();

        uint128 poapIdentifier = getPoapIdentifier();

        uint256 nftId = myPoapId[poapIdentifier][who];

        _burn(who, nftId, 1);

        // decrease totalSuply
        _burnAClass(poapIdentifier, who);
    }

    /// @notice current for test
    function _burnAClass(uint128 _poapId, address _who) internal  {
        totalSupply[_poapId]--;
        totalBalanceOf[_poapId][_who]--;
        emit BurnAClass(_poapId, totalSupply[_poapId]);
    }

    /// @notice current for test
    function getPoapIdentifier() public view returns (uint128) {
        address who = _msgSender();

        // query requestHash that this contract mapping to
        IFactory factory = IFactory(registry.addressOf(Properties.CONTRACT_POAP_FACTORY));

        // get rac address to read user's final credential
        IChecker rac = IChecker(registry.addressOf(Properties.CONTRACT_READ_GATEWAY));

        // get requestHash
        bytes32 requestHash = IFactory(factory).getRequestHash(address(this));

        // get user's zkID
        (bool isValid, uint128[] memory outputs) = rac.zkID(who, requestHash);

        require(isValid, "zkCredential must be valid");
        
        // get poapId through outputs
        uint256 poapId = uint256(keccak256(abi.encode(outputs)));
        uint128 poapIdentifier = uint128(poapId >> 128);

        return poapIdentifier;
    }
}