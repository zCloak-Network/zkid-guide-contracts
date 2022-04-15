const fs = require("fs");
const { ethers } = require("hardhat");
const {
    addrRegistry,
    addrRAC,
    addrFactory
} = require('../scripts/contract.json');

const {
    cType,
    fieldName,
    programHash,
    attesterAccount
} = require('./variable')

async function main() {
    // deploy the contract
    const owner = await ethers.getSigner(0);
    const user1 = await ethers.getSigner(1);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    let rac = RAC.attach(addrRAC);

    const Factory = await ethers.getContractFactory('PoapFactory', owner);
    let factory = Factory.attach(addrFactory);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });
    let uri = 'test';

    // attach an nft
    let txNewPoap = await factory.newPoap(rHash, uri, addrRegistry);
    await txNewPoap.wait();
    const ZcloakPoap = await ethers.getContractFactory('ZCloakPoap', owner);
    poap = ZcloakPoap.attach(await factory.connect(user1).rh2poaps(rHash));

    // owner set super auth to poap contract
    let txSuperAuth = await rac.superAuth(poap.address, true);
    await txSuperAuth.wait();

    console.log('SUCCESS: setting super auth');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });