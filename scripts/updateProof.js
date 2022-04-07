///
/// @author vsszhang
/// @dev This script only send addProof tx. User can add his/her proof.
/// Every user can only add proof once
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");


let newAttester = ethers.utils.formatBytes32String('newAttester');
let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

const { addrProofStorage } = require("./contract.json");
const { attesterAccount, cType, fieldName, programHash, newProofCid, rootHash, expectResult } = require("./variable.js");

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", user1);
    const proof = ProofStorage.attach(addrProofStorage);

    // user update proof
    const txUpdateProof = await proof.update_proof(kiltAccount, attesterAccount, cType, fieldName, programHash, newProofCid, rootHash, expectResult);
    await txUpdateProof.wait();
    console.log("SUCCESS: update proof");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });