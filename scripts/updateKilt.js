const { ethers } = require("hardhat");
const { deployer, provider, bytes32UINT_APPROVE_THRESHOLD } = require("./variable.js");

const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");


async function main() {
    const stAddress = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
    const registryAddress = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
    const whitelsitAdd = "0x4Cc6Ce9360d2249ad13Fe300D6Ac85B9CD3a538b";
    const kiltAdd = "0x72AcB0f573287B3eE0375964D220158cD18465cb";
    const propertyAdd = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";
    const rtransferAdd = "0xC8e2409A0E15CBe517E178972855D486e7E881e1";

    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
    const Registry = await ethers.getContractFactory("Registry");
    
    var kilt = await KiltProofsV1.attach(kiltAdd);
    // await kilt.deployed();
    // console.log("kilt address is: ", kilt.address);

    var regulated_role = await kilt.REGULATED_ERC20();
    await kilt.grantRole(regulated_role, rtransferAdd);

    // var registry = await Registry.attach(registryAddress);
    // var property = await ethers.getContractAt("Properties", propertyAdd);

    // let kiltproperty = await property.CONTRACT_MAIN_KILT();
    // await registry.setAddressProperty(kiltproperty, kilt.address);

    // let thresholdPro = await property.UINT_APPROVE_THRESHOLD();
    // await registry.setUintProperty(thresholdPro, 2);
    console.log("SUCCESS");
    
    // console.log("kilt in registry is: ", await registry.addressOf(kiltproperty));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });