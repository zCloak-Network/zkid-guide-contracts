const { ethers } = require("hardhat");
const { Contract } = require("hardhat/internal/hardhat-network/stack-traces/model");

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

    export default registry;
    export default properties;
    export default whitelist;
    export default kiltProofsV1;
    export default sampleToken;
    export default regulatedTransfer;

    console.log("Registry address: ", registry.address);
    console.log("Properties address: ", properties.address);
    console.log("Whitelist address: ", whitelist.address);
    console.log("KiltProofsV1 address: ", kiltProofsV1.address);
    console.log("SampleToken address: ", sampleToken.address);
    console.log("RegulatedTransfer address: ", regulatedTransfer.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });