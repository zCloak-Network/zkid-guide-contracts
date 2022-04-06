///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you add some useful things.
///
const { ethers } = require("hardhat");

// aggregator auth
const addressWhitelist = "0xd860C6c510bC1477487dfc0E089A5f8EC6D2B53E";
const woker = "0xBcc35D913aeC9063D6E3b6dB4c359Fa24F7EE14C";

async function main() {
    const Whitelist = await ethers.getContractFactory("SimpleAggregatorAuth");
    const whitelist = await Whitelist.attach(addressWhitelist);

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