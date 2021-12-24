///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you add some useful things.
///
const { ethers } = require("hardhat");

const addressWhitelist = "CONTRACT_WHITELIST_ADDRESS";

async function main() {
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await Whitelist.attach(addressWhitelist);

    const txAddWoker1 = await whitelist.addWorker("YOUR_ACCOUNT_ADDRESS");
    await txAddWoker1.wait();
    console.log("Are you worker? ", await whitelist.isWorker("YOUR_ACCOUNT_ADDRESS"));
    // you can add other characters as worker
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });