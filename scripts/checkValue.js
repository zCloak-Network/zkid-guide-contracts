///
/// @author vsszhang
/// @dev check value
///
const { ethers } = require("hardhat");

const addressRegistry = "CONTRACT_REGISTRY_ADDRESS";
const addressProperties = "CONTRACT_PROPERTIES_ADDRESS";
const addressWhitelist = "CONTRACT_WHITELIST_ADDRESS";
const addressKilt = "CONTRACT_KILT_ADDRESS";
const addressRegulatedTransfer = "CONTRACT_RT_ADDRESS";
const addressSampleToken = "CONTRACT_TOKEN_ADDRESS";
const addressERC20 = addressSampleToken;

async function main() {
    // create contract instance
    // const [owner, user1, user2, worker1, worker2, worker3] = await ethers.getSigners();
    const owner = await ethers.getSigner(0);
    const worker1 = await ethers.getSigner(3);
    
    const Registry = await ethers.getContractFactory("Registry", owner);
    const Properties = await ethers.getContractFactory("Properties", owner);
    const Whitelist = await ethers.getContractFactory("Whitelist", owner);
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", owner);
    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer", owner);
    const SampleToken = await ethers.getContractFactory("SampleToken", owner);

    const registry = await Registry.attach(addressRegistry);
    const properties = await Properties.attach(addressProperties);
    const whitelist = await Whitelist.attach(addressWhitelist);
    const kilt = await KiltProofsV1.attach(addressKilt);
    const regulatedTransfer = await RegulatedTransfer.attach(addressRegulatedTransfer);
    const sampleToken = await SampleToken.attach(addressSampleToken);

    // basic conditions
    // set up whitelist
    // await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);
    console.log("CONTRACT_WHITELIST property address: ", await registry.addressOf(properties.CONTRACT_WHITELIST()));
    console.log("Whitelist address: ", whitelist.address);

    // await whitelist.addWorker(worker1.address);
    console.log("worker1 is worker? ", await whitelist.isWorker(worker1.address));
    // you can add other characters as worker

    // set threshold as you want, default is 1
    // await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);
    console.log("UINT_APPROVE_THRESHOLD number: ", (await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).toString());

    // set CONTRACT_MAIN_KILT
    // await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);
    console.log("CONTRACT_MAIN_KILT property address: ", await registry.addressOf(properties.CONTRACT_MAIN_KILT()));
    console.log("KiltProofsV1 address: ", kilt.address);

    // grant REGULATED_ERC20 role to owner
    // await kilt.grantRole(kilt.REGULATED_ERC20(), owner.address);
    console.log("Owner has REGULATED_ERC20 role? ", await kilt.hasRole(kilt.REGULATED_ERC20(), owner.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });