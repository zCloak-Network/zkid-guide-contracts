const { ethers } = require("hardhat");

const { addrSAggregator, addrAddressesUtils, addrBytes32sUtils } = require("../../tmp/contract.json");
const { requestHash } = require("./variable.js");

const user = "ADDR";

async function main() {
    // create contract intance
    const owner = await ethers.getSigner(0);
    console.log(`owner addr: ${owner.address}`);
    const SAggregator = await ethers.getContractFactory(
        'SimpleAggregator',
        {
            libraries: {
                AddressesUtils: addrAddressesUtils,
                Bytes32sUtils: addrBytes32sUtils,
            },
        },
        owner
    );
    const aggregator = SAggregator.attach(addrSAggregator);

    console.log(`isFinished?: ${await aggregator.isFinished(user, requestHash)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });