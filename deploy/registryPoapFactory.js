const { ethers } = require('hardhat');

const { 
    addrRegistry,
    addrProperties,
    addrFactory
} = require('./scripts/contract.json')

async function main() {
    const owner = await ethers.getSigner(0);

    const Registry = await ethers.getContractFactory('Registry', owner);
    const regisry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const property = Properties.attach(addrProperties);

    console.log("Registry address is", regisry.address);
    console.log("properties address is", property.address);

    // let CONTRACT_MAIN_KILT = await property.CONTRACT_MAIN_KILT();
    // console.log("CONTRACT_MAIN_KILT is", CONTRACT_MAIN_KILT);
    // set registry
    console.log('Setting...');
    let tx = await regisry.setAddressProperty(await property.CONTRACT_POAP_FACTORY(), addrFactory);
    await tx.wait();

    console.log(`CONTRACT_POAP_FACTORY address: ${await regisry.addressOf(property.CONTRACT_POAP_FACTORY())}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });