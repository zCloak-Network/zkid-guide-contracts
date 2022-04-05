///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you initialize some useful things.
///
const { ethers } = require("hardhat");

async function main() {
    // deploy the contract
    const owner = await ethers.getSigner(0);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);
    let keepers = [ keeper1.address, keeper2.address, keeper3.address ];
    console.log("------------------ EXECUTION ------------------\n");
    console.log("\tContract deploying...\n");

    const Registry = await ethers.getContractFactory("Registry", owner);
    const Properties = await ethers.getContractFactory("Properties", owner);
    const AddressesUtils = await ethers.getContractFactory("AddressesUtils", owner);
    const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
    const RAC = await ethers.getContractFactory("ReadAccessController", owner);
    const RACAuth = await ethers.getContractFactory("RACAuth", owner);
    const ReputationAuth = await ethers.getContractFactory("ReputationAuth", owner);
    const SimpleAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);

    let registry = await Registry.deploy();
    await registry.deployed();

    let property = await Properties.deploy();
    await property.deployed();

    let addressesUtils = await AddressesUtils.deploy();
    await addressesUtils.deployed();

    let bytes32sUtils = await Bytes32sUtils.deploy();
    await bytes32sUtils.deployed();

    let proof = await ProofStorage.deploy(registry.address);
    await proof.deployed();

    let rac = await RAC.deploy(registry.address);
    await rac.deployed();

    let racAuth = await RACAuth.deploy(registry.address);
    await racAuth.deployed();

    let reputationAuth = await ReputationAuth.deploy(registry.address);
    await reputationAuth.deployed();

    let sAggregatorAuth = await SimpleAggregatorAuth.deploy(keepers, registry.address);
    await sAggregatorAuth.deployed();

    // library linking contract
    const Reputation = await ethers.getContractFactory(
        "Reputation",
        { libraries: { AddressesUtils: addressesUtils.address } },
        owner
    );
    let reputation = await Reputation.deploy(registry.address);
    await reputation.deployed();

    const SAggregator = await ethers.getContractFactory(
        "SimpleAggregator",
        {
            libraries: {
                AddressesUtils: addressesUtils.address,
                Bytes32sUtils: bytes32sUtils.address,
            },
        },
        owner
    );
    let sAggregator = await SAggregator.deploy(registry.address, rac.address);
    await sAggregator.deployed();

    // basic conditions
    // AuthControl setting
    console.log('\tAuthority control setting...\n');
    let txRACAuth = await rac.setAuthority(racAuth.address);
    await txRACAuth.wait();

    let txSAggregatorAuth = await sAggregator.setAuthority(sAggregatorAuth.address);
    await txSAggregatorAuth.wait();

    let txReputationAuth = await reputation.setAuthority(reputationAuth.address);
    await txReputationAuth.wait();

    // Registry setting
    console.log('\tRegistry setting...\n');
    // TODO: threshold is n:)?
    let txThreshold = await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
    await txThreshold.wait();

    let txRequest = await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
    await txRequest.wait();

    let txMainKilt = await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
    await txMainKilt.wait();

    let txReputation = await registry.setAddressProperty(property.CONTRACT_REPUTATION(), reputation.address);
    await txReputation.wait();

    let txAggregator = await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), sAggregator.address);
    await txAggregator.wait();

    let txReward = await registry.setAddressProperty(property.CONTRACT_REWARD(), reputation.address);
    await txReward.wait();

    let txReadGateway = await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);
    await txReadGateway.wait();

    console.log("\n------------------ SUMMARIZE ------------------\n");
    console.log(`\tContract owner:\n\t${owner.address}\n`);
    console.log(`\tRegistry address:\n\t${registry.address}\n`);
    console.log(`\tProperties address:\n\t${property.address}\n`);
    console.log(`\tAddressesUtils address:\n\t${addressesUtils.address}\n`);
    console.log(`\tBytes32sUtils address:\n\t${bytes32sUtils.address}\n`);
    console.log(`\tProofStorage address:\n\t${proof.address}\n`);
    console.log(`\tReadAccessController address:\n\t${rac.address}\n`);
    console.log(`\tRACAuth address:\n\t${racAuth.address}\n`);
    console.log(`\tReputationAuth address:\n\t${reputationAuth.address}\n`);
    console.log(`\tSimpleAggregatorAuth address:\n\t${sAggregatorAuth.address}\n`);
    console.log(`\tReputation address:\n\t${reputation.address}\n`);
    console.log(`\tSimpleAggregator address:\n\t${sAggregator.address}`);
    console.log("\n-----------------------------------------------\n");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });