const { ethers } = require("hardhat");

const { cType, fieldName, programHash, expectResult } = require("./variable.js");
let attester = ethers.utils.formatBytes32String("attester");
const {
    addrRegistry,
    addrProperties
} = require("./contract.json");

async function main() {
    // create contract intance
    const owner = await ethers.getSigner(0);

    const Registry = await ethers.getContractFactory('Registry', owner);
    const registry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const property = Properties.attach(addrProperties);
    
    // change threshold
    let tx = await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
    await tx.wait();
    console.log(`THRESHOLD: ${await registry.uint32Of(property.UINT32_THRESHOLD())}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });