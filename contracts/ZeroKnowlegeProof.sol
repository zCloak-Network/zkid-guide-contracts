// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// import "./common/Ownable.sol";

// import "@openzeppelin/contracts/proxy/Initializable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ZeroKnowlegeProof is ERC20 {

    event CreateTaskEvent(address sender, bytes programHash, string publicInputs, uint128[] outputs, uint8[] proofId);
    event AddWhitelistEvent(address sender, address white);
    event SaveProofEvent(address sender, address owner, bytes programHash, string publicInputs, bool result);
    event SaveProofFailedEvent(address sender, address owner, bytes programHash, string publicInputs, bool result);
    event AddClassTypeEvent(string class, bytes programHash);
    event RemoveClassTypeEvent(string class);

    mapping (address => mapping (bytes => mapping (string => bool))) proofs;
    mapping (address => bool) whitelist;
    mapping (string => bytes) classes;

    // function initialize() public initializer {
    //     ownableConstructor();
    // }

    constructor(uint256 initialSupply) ERC20("Proof", "PROOFTOK") {
    _mint(msg.sender, initialSupply);
    }

    function verify(
        bytes memory programHash,
        string memory publicInputs,
        uint128[] memory outputs,
        uint8[] memory proofId
    ) public returns(bytes memory,string memory,uint128[] memory,uint8[] memory){
        emit CreateTaskEvent(msg.sender, programHash, publicInputs, outputs, proofId);
        return (programHash, publicInputs, outputs, proofId);

    }

    function saveProof(
        address sender,
        address owner, 
        bytes memory programHash, 
        string memory publicInputs,
        bool result
        ) public {
        if (isWhitelist(sender)){
            proofs[owner][programHash][publicInputs] = result;
            emit SaveProofEvent(sender, owner, programHash, publicInputs, result);
        }else{
            emit SaveProofFailedEvent(sender, owner, programHash, publicInputs, result);
        }
    }

    function getProof(
        address sender,
        bytes memory programHash,
        string memory publicInputs
        ) public view returns (bool) {
        if (proofs[sender][programHash][publicInputs]) {
            return true;
        } else {
            return false;
        }
    }

    function addWhitelist(address white) public {
        _setWhite(white);
        emit AddWhitelistEvent(msg.sender, white);
    }

    function _setWhite(address white) internal {
        whitelist[white] = true;
    }

    function isWhitelist(address addr) public view returns (bool) {
        if (whitelist[addr]) {
            return true;
        }else{
            return false;
        }
    }

    function registerClass (
         string memory class,
         bytes memory programHash
        ) public {
        _addClass(class, programHash);
        emit AddClassTypeEvent(class, programHash);

    }

    function removeClass(string memory class) public {
        delete classes[class];
        emit RemoveClassTypeEvent(class);
    }

    function getClass(string memory class) public view returns (bytes memory) {
        return classes[class];
    }

    function _addClass(string memory class, bytes memory programHash) internal {
        classes[class] = programHash;
    }





}
