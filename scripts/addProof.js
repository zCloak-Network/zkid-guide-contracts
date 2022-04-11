///
/// @author vsszhang
/// @dev This script only send addProof tx. User can add his/her proof.
/// Every user can only add proof once
/// @notice test network: Moonbase Alpha
///
const { BigNumber } = require("ethers");
const BN = require("bn.js");
const { ethers } = require("hardhat");


let newAttester = ethers.utils.formatBytes32String('newAttester');
let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

const { attesterAccount, cType, fieldName, programHash, proofCid, rootHash, expectResult, proofStorageAddr } = require("./variable.js");



async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", user1);
    const proof = ProofStorage.attach(proofStorageAddr);

    // user add proof
    const txAddProof = await proof.addProof(kiltAccount, attesterAccount, cType, fieldName, programHash, proofCid, rootHash, expectResult);
    await txAddProof.wait();
    console.log("SUCCESS: add proof");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });