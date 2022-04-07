///
/// @author vsszhang
/// @dev This script only send addProof tx. User can add his/her proof.
/// Every user can only add proof once
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

let attester = ethers.utils.formatBytes32String("attester");
let newAttester = ethers.utils.formatBytes32String('newAttester');
let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

const { addrProofStorage } = require("./contract.json");
const { cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", user1);
    const proof = ProofStorage.attach(addrProofStorage);

    // user add proof
    console.log(`${user1.address} attempting addProof...`);
    const txAddProof = await proof.addProof(kiltAccount, attester, cType, fieldName, programHash, proofCid, rootHash, expectResult);
    await txAddProof.wait();
    console.log("SUCCESS: add proof");
    console.log(`Transaction hash: ${txAddProof.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });