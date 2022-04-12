///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you add some useful things.
///
const { ethers } = require("hardhat");

// aggregator auth
const {simpleAggregatorAuthAddr} = require("../scripts/variable.js");

const woker = "0xeaFeEAA1fE16e38cA3b098C3d82E6eead83594f0";

async function main() {
    const Whitelist = await ethers.getContractFactory("SimpleAggregatorAuth");
    const whitelist = await Whitelist.attach(simpleAggregatorAuthAddr);

    const txAddWoker1 = await whitelist.addWorker(woker);
    await txAddWoker1.wait();
    console.log("Are you worker? ", await whitelist.isWorker(woker));
    // you can add other characters as worker
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });