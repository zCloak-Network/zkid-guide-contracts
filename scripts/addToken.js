const { ethers } = require("hardhat");

const { addrRAC, addrReputation, addrAddressesUtils, addrFactory, addrRegistry} = require("./contract.json");
const { cType, fieldName, programHash, attesterAccount, requestHash } = require("./variable.js");

async function main() {
    console.log("start add poap...")
    const owner = await ethers.getSigner(0);
    const project = await ethers.getSigner(3);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    const Factory = await ethers.getContractFactory('PoapFactory', owner);
    const factory = Factory.attach(addrFactory);

    const Poap = await ethers.getContractFactory('ZCloakPoap', owner);
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

    console.log("start new poap..")

    let poapAddr = await factory.rh2poaps(requestHash);
    console.log("Poap address is ", poapAddr);

    await reputation.addToken(requestHash, poapAddr);

    console.log(`SUCCESS: add token`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });