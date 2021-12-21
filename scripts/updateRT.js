const { ethers } = require("hardhat");
const { deployer, provider, bytes32UINT_APPROVE_THRESHOLD } = require("./variable.js");

const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");


async function main() {
    const stAddress = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
    const registryAddress = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
    const whitelsitAdd = "0x4Cc6Ce9360d2249ad13Fe300D6Ac85B9CD3a538b";
    // const kiltAdd = "0x39820aA15dCB1c6575054F4806Ff80B5248B8495";
    const propertyAdd = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";
    const rtransferAdd = "0x7318F50474bc7b08A6a35fDf44e2E00Cb0b2FD6a";

    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
    const Registry = await ethers.getContractFactory("Registry");


    const RT = await await ethers.getContractFactory("RegulatedTransfer");
    var rt = await RT.deploy(registryAddress);
    
    await rt.deployed();
    console.log("rt address is : ", rt.address);
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });