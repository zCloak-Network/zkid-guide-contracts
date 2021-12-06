//const { ethers } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
    const deployer = await provider.getSigner();

    console.log("Deploying KiltProofsV1 contracts with account: ", await deployer.getAddress());
    
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

    const whiteList = await Whitelist.deploy();
    await whiteList.deployed();

    const kiltProofsV1 = await KiltProofsV1.deploy(registry.address);
    await kiltProofsV1.deployed();

    const sampleToken = await SampleToken.deploy("zCloak", "ZK");
    await sampleToken.deployed();

    const regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
    await regulatedTransfer.deployed();

    console.log("KiltProofsV1 address: ", kiltProofsV1.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });