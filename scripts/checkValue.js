///
/// @author vsszhang
/// @dev check value
///
const { ethers } = require("hardhat");
const { user1, user2, worker1, worker2, worker3, worker4, worker5 } = require("./variable.js");
const { addressKiltProofsV1, addressRegistry, addressWhitelist, addressProperties, addressRegulatedTransfer, addressERC20 } = require("./variable.js");
const { deployerWallet , worker1Wallet, worker2Wallet, worker3Wallet, worker4Wallet, worker5Wallet } = require("./variable.js");
const { rootHash, cType, programHash, isPassed, expectResult } = require("./variable.js");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiWhitelist = require("../artifacts/contracts/Whitelist.sol/Whitelist.json");
const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");
const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");

async function main() {
    const deployerRegistry = await new ethers.Contract(addressRegistry, abiRegistry.abi, deployerWallet);
    const deployerProperties = await new ethers.Contract(addressProperties, abiProperties.abi, deployerWallet);
    const deployerWhitelist = await new ethers.Contract(addressWhitelist, abiWhitelist.abi, deployerWallet);
    const deployerKiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, deployerWallet);
    const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerWallet);

    // console.log("Registry CONTRACT_MAIN_KILT: ", await deployerRegistry.addressOf(deployerProperties.CONTRACT_WHITELIST));
    // console.log("Registry CONTRACT_WHITELIST: ", await deployerRegistry.addressOf(deployerProperties.CONTRACT_WHITELIST));
    // console.log("Registry CONTRACT_MAIN_KILT: ", await deployerRegistry.addressOf(ethers.utils.formatBytes32String("CONTRACT_MAIN_KILT")));
    // console.log("Registry CONTRACT_WHITELIST: ", await deployerRegistry.addressOf(ethers.utils.formatBytes32String("CONTRACT_WHITELIST")));
    // console.log("worker2 is or not? ", await deployerWhitelist.isWorker(worker2));
    // console.log("single_proof_exists? ", await deployerKiltProofsV1.single_proof_exists(user2, cType, programHash));
    // console.log("hasSubmitted? ", await deployerKiltProofsV1.hasSubmitted(user2, worker2, rootHash, cType, programHash));
    console.log("Address represented by CONTRACT_WHITELIST: ", await deployerRegistry.addressOf(deployerProperties.CONTRACT_WHITELIST()));
    console.log("is worker?", await deployerWhitelist.isWorker(worker1));
    console.log("Address represented by CONTRACT_MAIN_KILT: ", await deployerRegistry.addressOf(deployerProperties.CONTRACT_MAIN_KILT()));
    console.log("has role? ", await deployerKiltProofsV1.hasRole(deployerKiltProofsV1.REGULATED_ERC20(), addressRegulatedTransfer));
    console.log("set program as trusted program? ", await deployerRegulatedTransfer.addRule(addressERC20, addressKiltProofsV1, cType, programHash, expectResult));

    console.log("RegulatedTransfer has REGULATED_ERC20 role? ", await deployerKiltProofsV1.hasRole(deployerKiltProofsV1.REGULATED_ERC20(), addressRegulatedTransfer));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });