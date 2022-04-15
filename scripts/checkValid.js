const { ethers } = require("hardhat");

const { attesterAccount, cType, fieldName, programHash, expectResult } = require("./variable.js");
const {
    addrRAC,
    addrSAggregator,
    addrAddressesUtils,
    addrBytes32sUtils
} = require("./contract.json");

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const project = await ethers.getSigner(3);

    const SimpleAggregator = await ethers.getContractFactory(
        "SimpleAggregator",
        {
            libraries: {
                AddressesUtils: addrAddressesUtils,
                Bytes32sUtils: addrBytes32sUtils,
            },
        },
        project
    );
    const sAggregator = SimpleAggregator.attach(addrSAggregator);

    const RAC = await ethers.getContractFactory("ReadAccessController", project);
    const rac = RAC.attach(addrRAC);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });

    // TODO: isValid is changed, check it
    console.log(`task wether finished or not? ${await sAggregator.isFinished(user1.address, rHash)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });