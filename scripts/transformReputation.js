//
// @dev keeper use this script to transform their reputation
// from communityReputation to individualReputation
//
const { ethers } = require("hardhat");

const { addrRAC, addrReputation, addrAddressesUtils } = require("./contract.json");
const { cType, fieldName, programHash, attesterAccount } = require("./variable.js");

async function main() {
    const owner = await ethers.getSigner(0);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    const Reputation = await ethers.getContractFactory(
        'Reputation',
        {
            libraries: {
                AddressesUtils: addrAddressesUtils
            }
        },
        owner
    );
    const reputation = Reputation.attach(addrReputation);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });

    let txTR1 = await reputation.connect(keeper1).transformReputation(rHash);
    await txTR1.wait();

    let txTR2 = await reputation.connect(keeper2).transformReputation(rHash);
    await txTR2.wait();

    let txTR3 = await reputation.connect(keeper3).transformReputation(rHash);
    await txTR3.wait();

    console.log(`SUCCESS: transform reputation`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });