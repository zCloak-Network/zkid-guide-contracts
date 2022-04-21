///
/// @author vsszhang
/// @dev check deployed value
///
const { ethers } = require("hardhat");

const {
    addrRegistry,
    addrProperties,
    addrSAggregatorAuth,
    addrFaucet
} = require("../tmp/contract.json");

async function main() {
    // create contract instance
    const owner = await ethers.getSigner(0);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);
    
    const Registry = await ethers.getContractFactory("Registry", owner);
    const registry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory("Properties", owner);
    const properties = Properties.attach(addrProperties);

    const SAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);
    const saAuth = SAggregatorAuth.attach(addrSAggregatorAuth);

    // check keeper
    console.log(`keeper1 is keeper?: ${await saAuth.isWorker(keeper1.address)}`);
    console.log(`keeper2 is keeper?: ${await saAuth.isWorker(keeper2.address)}`);
    console.log(`keeper3 is keeper?: ${await saAuth.isWorker(keeper3.address)}`);

    // basic conditions
    console.log(`THRESHOLD: ${await registry.uint32Of(properties.UINT32_THRESHOLD())}`);
    console.log(`CONTRACT_REQUEST address: ${await registry.addressOf(properties.CONTRACT_REQUEST())}`);
    console.log(`CONTRACT_MAIN_KILT address: ${await registry.addressOf(properties.CONTRACT_MAIN_KILT())}`);
    console.log(`CONTRACT_REPUTATION address: ${await registry.addressOf(properties.CONTRACT_REPUTATION())}`);
    console.log(`CONTRACT_AGGREGATOR address: ${await registry.addressOf(properties.CONTRACT_AGGREGATOR())}`);
    console.log(`CONTRACT_REWARD address: ${await registry.addressOf(properties.CONTRACT_REWARD())}`);
    console.log(`CONTRACT_READ_GATEWAY address: ${await registry.addressOf(properties.CONTRACT_READ_GATEWAY())}`);
    console.log(`CONTRACT_POAP_FACTORY address: ${await registry.addressOf(properties.CONTRACT_POAP_FACTORY())}`);

    // check faucet balance
    let provider = new ethers.providers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    let balance = await provider.getBalance(addrFaucet);
    console.log(`faucet balance is ${ethers.utils.formatEther(balance)} ether`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });