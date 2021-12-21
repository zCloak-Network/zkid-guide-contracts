///
/// @author vsszhang
/// @dev After user adds his/her proof and workers verify the proof, user1 can send
/// sample token (ZK) to user2
///
const { ethers } = require("hardhat");
const { user1, user2, worker2 } = require("./variable.js");
const { user1Wallet, deployerWallet, worker2Wallet } = require("./variable.js");
const { addressRegulatedTransfer, addressERC20, addressKiltProofsV1, addressUSDT, expectResult } = require("./variable.js");
const { unit, cType, programHash } = require("./variable.js");
const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");
const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");
const abiWhitelist = require("../artifacts/contracts/Whitelist.sol/Whitelist.json");
const abiSampleToken = require("../artifacts/contracts/SampleToken.sol/SampleToken.json");

async function main() {
    /// contract instance
    // const deployerProperties = await new ethers.Contract(properties.address, abiProperties.abi, deployerWallet);
    // const deployerKiltProofsV1 = await new ethers.Contract(whitelist.address, abiKiltProofsV1.abi, deployerWallet);
    const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerWallet);
    // const deployerRegistry = await new ethers.Contract(registry.address, abiRegistry.abi, deployerWallet);
    // const deployerWhitelist = await new ethers.Contract(whitelist.address, abiWhitelist.abi, deployerWallet);

    // await deployerRegistry.setAddressProperty(deployerProperties.CONTRACT_MAIN_KILT(), kiltProofsV1.address);
    // console.log("CONTRACT_MAIN_KILT address: ", await deployerRegistry.addressOf(deployerProperties.CONTRACT_MAIN_KILT()));

    // await deployerKiltProofsV1.grantRole(deployerKiltProofsV1.REGULATED_ERC20(), regulatedTransfer.address);
    // console.log("RegulatedTransfer has REGULATED_ERC20 role? ", deployerKiltProofsV1.hasRole(deployerKiltProofsV1.REGULATED_ERC20(), regulatedTransfer.address));

    // await deployerRegulatedTransfer.addRule(addressERC20, addressKiltProofsV1, cType, programHash, expectResult);
    // console.log("Successfully add new rule for third party.");

    // let ERC20Fac = await ethers.getContractFactory("SampleToken");
    // let erc20 = await ERC20Fac.attach(addressERC20);
    const ERC20 = await new ethers.Contract(addressERC20, abiSampleToken.abi, worker2Wallet);
    let balance = await ERC20.balanceOf(worker2);
    console.log("worker2 balance is: {}", balance);

    // await ERC20.approve(addressRegulatedTransfer, 10000000000);
    console.log("allowance is: ", ERC20.allowance(worker2, addressRegulatedTransfer));

    /// generate user1's contract instance
    const RegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, worker2Wallet);

    await RegulatedTransfer.rTransfer(addressKiltProofsV1, addressERC20, user2, 1 * unit, cType, programHash);
    console.log("User1 successfully transfer token to user2.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });