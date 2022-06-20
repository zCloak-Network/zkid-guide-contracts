const { ethers } = require("hardhat");

// aggregator auth
const {addrSAggregatorAuth} = require("../../tmp/contract.json");

async function main() {
    // only apply to local status
    const keeper4 = await ethers.getSigner(9);
    const keeper5 = await ethers.getSigner(10);
    const keeper6 = await ethers.getSigner(11);

    console.log(`keeper4: ${keeper4.address}`);
    console.log(`keeper5: ${keeper5.address}`);
    console.log(`keeper6: ${keeper6.address}`);

    const Whitelist = await ethers.getContractFactory("SimpleAggregatorAuth");
    const whitelist = Whitelist.attach(addrSAggregatorAuth);

    await whitelist.addWorker(keeper4.address);
    await whitelist.addWorker(keeper5.address);
    await whitelist.addWorker(keeper6.address);
    console.log("is keeper4 granted? ", await whitelist.isWorker(keeper4.address));
    console.log("is keeper5 granted? ", await whitelist.isWorker(keeper5.address));
    console.log("is keeper6 granted? ", await whitelist.isWorker(keeper6.address));
    // you can add other characters as worker
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });