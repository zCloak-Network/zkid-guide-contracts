///
/// @author vsszhang
/// @dev This script only send addProof tx. User can add his/her proof.
/// Every user can only add proof once
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

const { kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");

const addressKiltProofsV1 = "CONTRACT_KILT_ADDRESS";

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", user1);
    const kilt = await KiltProofsV1.attach(addressKiltProofsV1);

    // character add proof
    console.log("check the proof exists or not? ", await kilt.single_proof_exists(user1.address, cType, programHash));
    const txAddProof = await kilt.addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
    await txAddProof.wait();
    console.log("Successfully send the addProof transcation.");
    console.log("check the proof exists or not? ", await kilt.single_proof_exists(user1.address, cType, programHash));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });