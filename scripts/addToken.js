const { ethers } = require("hardhat");

const { addrRAC, addrReputation, addrAddressesUtils, addrFactory, addrRegistry} = require("./contract.json");
const { cType, fieldName, programHash, attesterAccount } = require("./variable.js");

async function main() {
    console.log("start add poap...")
    const owner = await ethers.getSigner(0);
    const project = await ethers.getSigner(3);
    let requestHash = "0x347a7502b61df145b7d7c540d2cb16713b259ea7166a2e184e6d8407e6d0f01b";

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

    // new poap
    let newPoaptx = await factory.newPoap(requestHash, "URI");
    await newPoaptx.wait();

    let poapAddr = await factory.rh2poaps(requestHash);
    console.log("Poap address is ", poapAddr);

    let tx = await reputation.addToken(requestHash, poapAddr);
    await tx.wait();

    console.log(`SUCCESS: add token`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });