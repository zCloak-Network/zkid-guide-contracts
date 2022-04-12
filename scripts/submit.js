///
/// @author vsszhang
/// @dev In this script, I will show you how to add verification. Before everything
/// starts, you need add proof first. Also, your must be a worker (your worker
/// identity in our whitelist).
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

const { 
    cType,
    fieldName,
    programHash,
    proofCid,
    rootHash,
    expectResult,
    isPassed,
    attesterAccount
} = require("./variable.js");

const {
    addrRAC,
    addrSAggregator,
    addrAddressesUtils,
    addrBytes32sUtils
} = require("./contract.json");

async function main() {
    // generate workers contract instance
    const owner = await ethers.getSigner(0);
    const user1 = await ethers.getSigner(1);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);

    const RAC = await ethers.getContractFactory("ReadAccessController", owner);
    const rac = RAC.attach(addrRAC);

    const SAggregator = await ethers.getContractFactory(
        "SimpleAggregator",
        {
            libraries: {
                AddressesUtils: addrAddressesUtils,
                Bytes32sUtils: addrBytes32sUtils,
            },
        },
        owner
    );
    const sAggregator = SAggregator.attach(addrSAggregator);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });

    const txKeeper1Submit = await sAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, false, attesterAccount, expectResult);
    await txKeeper1Submit.wait();
    console.log(`keepre1 submit tx hash: ${txKeeper1Submit.hash}`);
    console.log("keeper1 has submitted verification? ", await sAggregator.hasSubmitted(keeper1.address, user1.address, rHash));

    const txKeeper2Submit = await sAggregator.connect(keeper2).submit(user1.address, rHash, cType, rootHash, true, attesterAccount, expectResult);
    await txKeeper2Submit.wait();
    console.log(`keepre2 submit tx hash: ${txKeeper2Submit.hash}`);
    console.log("keeper2 has submitted verification? ", await sAggregator.hasSubmitted(keeper2.address, user1.address, rHash));

    const txKeeper3Submit = await sAggregator.connect(keeper3).submit(user1.address, rHash, cType, rootHash, true, attesterAccount, expectResult);
    await txKeeper3Submit.wait();
    console.log(`keepre3 submit tx hash: ${txKeeper2Submit.hash}`);
    console.log("keeper3 has submitted verification? ", await sAggregator.hasSubmitted(keeper3.address, user1.address, rHash));

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });