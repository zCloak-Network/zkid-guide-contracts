///
/// @author vsszhang
/// @dev In this script, I will show you how to add verification. Before everything
/// starts, you need add proof first. Also, your must be a worker (your worker
/// identity in our whitelist).
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

const { rootHash, cType, programHash, isPassed } = require("./variable.js");

const addressKiltProofsV1 = "CONTRACT_KILT_ADDRESS";

async function main() {
    // generate workers contract instance
    // const [owner, user1, user2, worker1, worker2, worker3] = await ethers.getSigners();
    const user1 = await ethers.getSigner(1);
    const worker1 = await ethers.getSigner(3);
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", worker1);
    const kilt = await KiltProofsV1.attach(addressKiltProofsV1);

    console.log("check the proof exist or not? ", await kilt.single_proof_exists(user1.address, cType, programHash));
    console.log("worker1 has submitted verification? ", await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash));
    const txWokerAddVerification = await kilt.addVerification(user1.address, rootHash, cType, programHash, isPassed);
    await txWokerAddVerification.wait();
    console.log("Successfully send the addVerification transcation.");
    console.log("worker1 has submitted verification? ", await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });