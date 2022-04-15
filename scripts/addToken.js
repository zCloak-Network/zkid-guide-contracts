const { ethers } = require("hardhat");

const { addrRAC, addrReputation, addrAddressesUtils } = require("./contract.json");
const { addrToken } = require("./token.json");
const { cType, fieldName, programHash, attesterAccount } = require("./variable.js");

async function main() {
    const owner = await ethers.getSigner(0);
    const project = await ethers.getSigner(3);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    const Reputation = await ethers.getContractFactory(
        'Reputation',
        {
            libraries: {
                AddressesUtils: addrAddressesUtils
            }
        },
        project
    );
    const reputation = Reputation.attach(addrReputation);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });
    let tx = await reputation.addToken(rHash, addrToken);
    await tx.wait();

    console.log(`SUCCESS: add token`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });