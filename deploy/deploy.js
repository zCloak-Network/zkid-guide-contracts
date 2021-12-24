///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you add some useful things.
///
const { ethers } = require("hardhat");

async function main() {
    // deploy the contract
    const [owner] = await ethers.getSigners();
    console.log("Contract owner address: ", owner.address);

    const Registry = await ethers.getContractFactory("Registry", owner);
    const Properties = await ethers.getContractFactory("Properties", owner);
    const Whitelist = await ethers.getContractFactory("Whitelist", owner);
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", owner);
    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer", owner);
    const SampleToken = await ethers.getContractFactory("SampleToken", owner);

    const registry = await Registry.deploy();
    await registry.deployed();
    console.log("Registry address: ", registry.address);

    const properties = await Properties.deploy();
    await properties.deployed();
    console.log("Properties address: ", properties.address);

    const whitelist = await Whitelist.deploy();
    await whitelist.deployed();
    console.log("Whitelist address: ", whitelist.address);

    const kilt = await KiltProofsV1.deploy(registry.address);
    await kilt.deployed();
    console.log("Kilt address: ", kilt.address);

    const regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
    await regulatedTransfer.deployed();
    console.log("RegulatedTransfer address: ", regulatedTransfer.address);

    const sampleToken = await SampleToken.deploy("TOKEN_NAME", "MTK");
    await sampleToken.deployed();
    console.log("SampleToken address: ", sampleToken.address);
    
    // basic conditions
    // set up whitelist
    const txRegistryCONTRACT_WHITELIST = await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);
    await txRegistryCONTRACT_WHITELIST.wait();
    console.log("CONTRACT_WHITELIST property address: ", await registry.addressOf(properties.CONTRACT_WHITELIST()));
    console.log("Whitelist address: ", whitelist.address);

    // set threshold as you want, default is 1
    const txRegistryUINT_APPROVE_THRESHOLD = await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);
    await txRegistryUINT_APPROVE_THRESHOLD.wait();
    console.log("UINT_APPROVE_THRESHOLD number: ", (await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).toString());

    // set CONTRACT_MAIN_KILT
    const txRegistryCONTRACT_MAIN_KILT = await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);
    await txRegistryCONTRACT_MAIN_KILT.wait();
    console.log("CONTRACT_MAIN_KILT property address: ", await registry.addressOf(properties.CONTRACT_MAIN_KILT()));
    console.log("KiltProofsV1 address: ", kilt.address);

    // grant role to contract 'RegulatedTransfer'
    const txGrantRoleREGULATED_ERC20toRT = await kilt.grantRole(kilt.REGULATED_ERC20(), regulatedTransfer.address);
    await txGrantRoleREGULATED_ERC20toRT.wait();
    console.log("Contract 'RegulatedTransfer' has REGULATED_ERC20 role? ", await kilt.hasRole(kilt.REGULATED_ERC20(), regulatedTransfer.address));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });