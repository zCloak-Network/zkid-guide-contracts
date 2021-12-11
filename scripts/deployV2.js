const { ethers } = require("hardhat");
const { deployer, provider, bytes32UINT_APPROVE_THRESHOLD } = require("./variable.js");

const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");
const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");

async function main() {
    //const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
    //const deployer = await provider.getSigner();

    const Registry = await ethers.getContractFactory("Registry");
    const Properties = await ethers.getContractFactory("Properties");
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
    const SampleToken = await ethers.getContractFactory("SampleToken");
    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer");

    const registry = await Registry.deploy();
    await registry.deployed();

    const properties = await Properties.deploy();
    await properties.deployed();

    const whitelist = await Whitelist.deploy();
    await whitelist.deployed();

    const kiltProofsV1 = await KiltProofsV1.deploy(registry.address);
    await kiltProofsV1.deployed();

    const sampleToken = await SampleToken.deploy("zCloak", "ZK");
    await sampleToken.deployed();

    const regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
    await regulatedTransfer.deployed();

    console.log("Registry address: ", registry.address);
    console.log("Properties address: ", properties.address);
    console.log("Whitelist address: ", whitelist.address);
    console.log("KiltProofsV1 address: ", kiltProofsV1.address);
    console.log("SampleToken address: ", sampleToken.address);
    console.log("RegulatedTransfer address: ", regulatedTransfer.address);

    // const deployerSigner = await provider.getSigner(deployer);
    // const deployerRegistry = await Registry.attach(registry.address);
    // const deployerProperties = await Properties.attach(properties.address);
    // const deployerKiltProofsV1 = await KiltProofsV1.attach(kiltProofsV1.address);
    // const deployerRegulatedTransfer = await RegulatedTransfer.attach(regulatedTransfer.address);

    // const deployerAccount_from = {
    //     privateKey: '0bc365e0e28a4134f0ce5568f562e0adeeefda7edc636d443cdab3ed8a4e92fd',
    // };
    // let deployerWallet = await new ethers.Wallet(deployerAccount_from.privateKey, provider);


 
    // /// set a threshold for _apporveCredential() and _approveStarkProof()
    // await deployerRegistry.setUintProperty(ethers.utils.formatBytes32String("UINT_APPROVE_THRESHOLD"), 3);

    // /// set workers contract whitelist
    
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });