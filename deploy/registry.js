const { ethers } = require('hardhat');

const { 
    addrRegistry,
    addrProperties,
    addrAddressesUtils,
    addrBytes32sUtils,
    addrProofStorage,
    addrFactory,
    addrRAC,
    addrReputation,
    addrSAggregator,
    addrRACAuth,
    addrSAggregatorAuth,
    addrReputationAuth
} = require('../scripts/contract.json')

async function main() {
    const owner = await ethers.getSigner(0);

    const Registry = await ethers.getContractFactory('Registry', owner);
    const registry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory('Properties', owner);
    const property = Properties.attach(addrProperties);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    const Reputation = await ethers.getContractFactory(
        "Reputation",
        { libraries: { AddressesUtils: addrAddressesUtils } },
        owner
    );
    const reputation = Reputation.attach(addrReputation);

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

    // AuthControl setting
    console.log('Authority control setting...\n');
    let txRACAuth = await rac.setAuthority(addrRACAuth);
    await txRACAuth.wait();

    let txSAggregatorAuth = await sAggregator.setAuthority(addrSAggregatorAuth);
    await txSAggregatorAuth.wait();

    let txReputationAuth = await reputation.setAuthority(addrReputationAuth);
    await txReputationAuth.wait();

    // Registry setting
    console.log('Registry setting...\n');
    let txThreshold = await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
    await txThreshold.wait();
    console.log(`THRESHOLD: ${await registry.uint32Of(property.UINT32_THRESHOLD())}`);

    let txRequest = await registry.setAddressProperty(property.CONTRACT_REQUEST(), addrRAC);
    await txRequest.wait();
    console.log(`CONTRACT_REQUEST address: ${await registry.addressOf(property.CONTRACT_REQUEST())}`);

    let txMainKilt = await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), addrProofStorage);
    await txMainKilt.wait();
    console.log(`CONTRACT_MAIN_KILT address: ${await registry.addressOf(property.CONTRACT_MAIN_KILT())}`);

    let txReputation = await registry.setAddressProperty(property.CONTRACT_REPUTATION(), addrReputation);
    await txReputation.wait();
    console.log(`CONTRACT_REPUTATION address: ${await registry.addressOf(property.CONTRACT_REPUTATION())}`);

    let txAggregator = await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), addrSAggregator);
    await txAggregator.wait();
    console.log(`CONTRACT_AGGREGATOR address: ${await registry.addressOf(property.CONTRACT_AGGREGATOR())}`);

    let txReward = await registry.setAddressProperty(property.CONTRACT_REWARD(), addrReputation);
    await txReward.wait();
    console.log(`CONTRACT_REWARD address: ${await registry.addressOf(property.CONTRACT_REWARD())}`);

    let txReadGateway = await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), addrRAC);
    await txReadGateway.wait();
    console.log(`CONTRACT_READ_GATEWAY address: ${await registry.addressOf(property.CONTRACT_READ_GATEWAY())}`);

    let txPoapFactory = await registry.setAddressProperty(property.CONTRACT_POAP_FACTORY(), addrFactory);
    await txPoapFactory.wait();
    console.log(`CONTRACT_POAP_FACTORY address: ${await registry.addressOf(property.CONTRACT_POAP_FACTORY())}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });