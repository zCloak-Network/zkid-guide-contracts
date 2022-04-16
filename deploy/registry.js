const { ethers } = require('hardhat');

const { 
    addrRegistry,
    addrProperties,
    addrProofStorage,
    addrFactory
} = require('../scripts/moon.json')

// const addrProperties = '0xe72dBAe236d2bF088f41824Fcd8297f7c3D46a45';

async function main() {
    const owner = await ethers.getSigner(0);

    const Registry = await ethers.getContractFactory('Registry', owner);
    const regisry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const property = Properties.attach(addrProperties);

    // set registry
    console.log('Setting...');
    let tx = await regisry.setAddressProperty(property.CONTRACT_MAIN_KILT(), addrProofStorage);
    await tx.wait();

    console.log(`CONTRACT_MAIN_KILT address: ${await regisry.addressOf(property.CONTRACT_MAIN_KILT())}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });