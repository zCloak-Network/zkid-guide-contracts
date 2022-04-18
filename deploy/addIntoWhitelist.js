///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you add some useful things.
///
const { ethers } = require("hardhat");

// aggregator auth
const {addrSAggregatorAuth} = require("../scripts/contract.json");


async function main() {
    // only apply to local status
    const keeper1 = await ethers.getSigner(3);
    const keeper2 = await ethers.getSigner(4);

    const Whitelist = await ethers.getContractFactory("SimpleAggregatorAuth");
    const whitelist = await Whitelist.attach(addrSAggregatorAuth);

    
    await whitelist.addWorker(keeper1.address);
    await whitelist.addWorker(keeper2.address)
    console.log("is keeper1 granted? ", await whitelist.isWorker(keeper1.address));
    console.log("is keeper2 granted? ", await whitelist.isWorker(keeper2.address));
    // you can add other characters as worker
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });