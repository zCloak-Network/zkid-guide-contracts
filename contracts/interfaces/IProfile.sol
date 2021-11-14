// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProfile {

    event ProofUploaded(address who, bytes32 proofCid);

    // TODO: kyc type, not defined yet.
    struct kyc {
        uint256 anytype;
    }

    /*
    * Query functions
    */
    // Check if `who` has satisfied the kyc requirement
    function isVerified(address who, kyc memory requirement) external view returns (bool);



    /*
    * Write function
    */
    // 
    function createTask(bytes32 proofCid) external view returns (bool);

}


interface IKycRegistry {
    // Register kyc program type, any need to add program metadata??
    function regiter_kyc_type(bytes32 programHash) external returns (bool);
}


interface IApply {
    // Any team can apply for a kyc whitelist
    function applyFor(uint8 kycAgent/* and some more program metadata */) external returns (bool);
}