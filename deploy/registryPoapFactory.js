const { ethers } = require('hardhat');

const { 
    addrRegistry,
    addrProperties,
    addrFactory
} = require('../scripts/moon.json')

async function main() {
    const owner = await ethers.getSigner(0);

    const Registry = await ethers.getContractFactory('Registry', owner);
    const regisry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const property = Properties.attach(addrProperties);

    // set registry
    console.log('Setting...');
    let tx = await regisry.setAddressProperty(property.CONTRACT_POAP_FACTORY(), addrFactory);
    await tx.wait();

    console.log(`CONTRACT_POAP_FACTORY address: ${await regisry.addressOf(property.CONTRACT_POAP_FACTORY())}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });