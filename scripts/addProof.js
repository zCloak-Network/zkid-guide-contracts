///
/// @author vsszhang
/// @dev This script only send addProof tx. User1 add his/her proof in out contract.
/// Every user can only add proof once
///
const { ethers } = require("hardhat");
const { user1Wallet, user2Wallet, worker1Wallet, worker3Wallet} = require("./variable.js");
const { addressKiltProofsV1 } = require("./variable.js");
const { kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");

async function main() {

    /// generate user1's contract instance
    const KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker3Wallet);

    /// user add proof
    await KiltProofsV1.addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
    console.log("worker3 successfully add proof.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });