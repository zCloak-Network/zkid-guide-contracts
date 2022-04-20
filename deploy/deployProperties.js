const { ethers } = require("hardhat");

async function main() {
    // deploy the contract
    const owner = await ethers.getSigner(0);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const properties = await Properties.deploy();
    await properties.deployed();

    console.log(`new Properties' address: ${properties.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });