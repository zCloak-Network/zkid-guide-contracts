pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract KycOrg is Ownable {


    uint32 public agentCount;

    mapping(uint32 => string) public agents;
    // An agent can set a default program to verify the validity
    // of a user's profile
    mapping(uint32 => bytes32) public validityProgram;


    function addKycAgent(bytes32 _programHash, string memory _name) onlyOwner public {
        agentCount++;
        agents[agentCount] = _name;
        validityProgram[agentCount] = _programHash;
    }

    

}