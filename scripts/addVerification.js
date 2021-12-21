///
/// @author vsszhang
/// @dev This script only send addVerification tx. Workers call it to verify the user's proof
///
const { ethers } = require("hardhat");
const { user1, user2, worker1, worker2, worker3, worker4, worker5 } = require("./variable.js");
const { addressKiltProofsV1, addressRegistry, addressWhitelist } = require("./variable.js");
const { deployerWallet , worker1Wallet, worker2Wallet, worker3Wallet, worker4Wallet, worker5Wallet } = require("./variable.js");
const { rootHash, cType, programHash, isPassed } = require("./variable.js");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiWhitelist = require("../artifacts/contracts/Whitelist.sol/Whitelist.json");
const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");

async function main() {
    /// generate workers contract instance
    const worker1KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker1Wallet);
    const worker2KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker2Wallet);
    const worker3KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker3Wallet);
    // const worker4KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker4Wallet);
    // const worker5KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker5Wallet);

    console.log("address: ", worker2);

    await worker1KiltProofsV1.addVerification(worker2, rootHash, cType, programHash, isPassed);
    console.log("Worker1 successfully add one verification.");

    await worker2KiltProofsV1.addVerification(worker2, rootHash, cType, programHash, isPassed);
    console.log("Worker2 successfully add one verification.");
    
    await worker3KiltProofsV1.addVerification(worker2, rootHash, cType, programHash, isPassed);
    console.log("Worker3 successfully add one verification.");

    // await worker4KiltProofsV1.addVerification(user1, rootHash, cType, programHash, isPassed);
    // console.log("Worker4 successfully add one verification.");

    // await worker5KiltProofsV1.addVerification(user1, rootHash, cType, programHash, isPassed);
    // console.log("Worker5 successfully add one verification.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });