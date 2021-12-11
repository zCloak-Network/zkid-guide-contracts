///
/// @author vsszhang
/// @dev 'user1' is user, 'Moonbase Alpha 1' is deployer, the 'dataOwner' 
/// address is user1 address.
///
const { ethers } = require("hardhat");
const {
    bytes32rootHash,
    bytes32CType,
    programHash,
    bytes32ProgramHash,
    isPassed,
    user1,
    worker1,
    worker2,
    worker3,
    worker4,
    worker5,
    addressKiltProofsV1,
    addressRegistry,
    addressProperties,
    addressWhitelist,
    provider
} = require("./variable.js");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");
// const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiWhitelist = require("../artifacts/contracts/Whitelist.sol/Whitelist.json");

async function main() {
    const deployerAccount_from = {
        privateKey: '0bc365e0e28a4134f0ce5568f562e0adeeefda7edc636d443cdab3ed8a4e92fd',
    };
    let deployerWallet = await new ethers.Wallet(deployerAccount_from.privateKey, provider);

    const worker1Account_from = {
        privateKey: '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    };
    let worker1Wallet = await new ethers.Wallet(worker1Account_from.privateKey, provider);

    const deployerRegistry = await new ethers.Contract(addressRegistry, abiRegistry.abi, deployerWallet);
    const deployerWhitelist = await new ethers.Contract(addressWhitelist, abiWhitelist.abi, deployerWallet);

    const worker1KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, worker1Wallet);
    // const worker1Registry = await new ethers.Contract(addressRegistry, abiRegistry.abi, worker1Wallet);
    // const worker1Properties = await new ethers.Contract(addressProperties, abiProperties.abi, worker1Wallet);
    // const worker1Whitelist = await new ethers.Contract(worker1Registry.addressOf(worker1Properties.CONTRACT_WHITELIST), abiWhitelist.abi, worker1Wallet);

    /// add worker1 in our registry
    await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_WHITELIST"), worker1);
    await deployerWhitelist.addWorker(worker1);

    // /// add worker2 in our registry
    // await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_WHITELIST"), worker2);
    // await deployerWhitelist.addWorker(worker2);

    // /// add worker3 in our registry
    // await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_WHITELIST"), worker3);
    // await deployerWhitelist.addWorker(worker3);

    // /// add worker4 in our registry
    // await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_WHITELIST"), worker4);
    // await deployerWhitelist.addWorker(worker4);

    // /// add worker5 in our registry
    // await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_WHITELIST"), worker5);
    // await deployerWhitelist.addWorker(worker5);

    console.log("Successfully add all worker in registry, They are legal now.");

    /// set up the credential and proof threshold
    await deployerRegistry.setUintProperty(ethers.utils.formatBytes32String("UINT_APPROVE_THRESHOLD"), 3);

    console.log("Successfully set up threshold.");

    /// worker call addVerification
    await worker1KiltProofsV1.addVerification(user1, bytes32rootHash, bytes32CType, bytes32ProgramHash, isPassed);

    console.log("Successfully call addVerfication.");

}

main()
    .then(() =>
        process.exit(0)
    )
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });