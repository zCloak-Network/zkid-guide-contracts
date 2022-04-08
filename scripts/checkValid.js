const { ethers } = require("hardhat");

const { attesterAccount, cType, fieldName, programHash, expectResult } = require("./variable.js");
let attester = ethers.utils.formatBytes32String("attester");
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

    let rHash = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attesterAccount);

    console.log(`proof wether valid or not? ${await sAggregator.isValid(user1.address, rHash)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });