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

const { kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");
const proofStorage = {
    address: '0xe9fa9A2163073bE7d8FD8E6C58aEF472B7dF4FE8'
}

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", user1);
    const proof = ProofStorage.attach(proofStorage.address);

    // user add proof
    const txAddProof = await proof.addProof(kiltAccount, attester, cType, fieldName, programHash, proofCid, rootHash, expectResult);
    await txAddProof.wait();
    console.log("SUCCESS: add proof");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });