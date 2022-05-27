///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you initialize some useful things.
///
const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
    // deploy the contract
    const owner = await ethers.getSigner(0);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);
    // the account to transfer ethers to faucet
    let transferer = await ethers.getSigner(9);
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
    const Faucet = await ethers.getContractFactory('Faucet', owner);
    const PoapFactory = await ethers.getContractFactory('PoapFactory', owner);

    let registry = await Registry.deploy();
    await registry.deployed();
    console.log(`Registey: ${registry.address}`);

    console.log("registry deployed", registry.address);

    let property = await Properties.deploy();
    await property.deployed();
    console.log(`Properties: ${property.address}`);

    let addressesUtils = await AddressesUtils.deploy();
    await addressesUtils.deployed();
    console.log(`AddressesUtils: ${addressesUtils.address}`);

    let bytes32sUtils = await Bytes32sUtils.deploy();
    await bytes32sUtils.deployed();
    console.log(`Bytes32Utils: ${bytes32sUtils.address}`);

    let proof = await ProofStorage.deploy(registry.address);
    await proof.deployed();
    console.log("proof deployed", proof.address);

    let rac = await RAC.deploy(registry.address);
    await rac.deployed();
    console.log("rac deployed", rac.address);

    let racAuth = await RACAuth.deploy(registry.address);
    await racAuth.deployed();
    console.log(`ReadAccessControllerAuth: ${racAuth.address}`);

    let reputationAuth = await ReputationAuth.deploy(registry.address);
    await reputationAuth.deployed();
    console.log(`ReputationAuth: ${reputationAuth.address}`);

    let sAggregatorAuth = await SimpleAggregatorAuth.deploy(keepers, registry.address);
    await sAggregatorAuth.deployed();
    console.log(`SimpleAggregatorAuth: ${sAggregatorAuth.address}`);

    console.log("sAggregatorAuth deployed", sAggregatorAuth.address);

    // library linking contract
    const Reputation = await ethers.getContractFactory(
        "Reputation",
        { libraries: { AddressesUtils: addressesUtils.address } },
        owner
    );
    let reputation = await Reputation.deploy(registry.address);
    await reputation.deployed();
    console.log(`Reputation: ${reputation.address}`);

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
    let sAggregator = await SAggregator.deploy(registry.address);
    await sAggregator.deployed();
    console.log("sAggregator deployed", sAggregator.address);

    let faucet = await Faucet.deploy();
    await faucet.deployed();

    console.log("faucet address is", faucet.address);

    let factory = await PoapFactory.deploy(registry.address);
    await factory.deployed();

    // output result to JSON file
    const obj = {
        addrRegistry: registry.address,
        addrProperties: property.address,
        addrAddressesUtils: addressesUtils.address,
        addrBytes32sUtils: bytes32sUtils.address,
        addrProofStorage: proof.address,
        addrRAC: rac.address,
        addrRACAuth: racAuth.address,
        addrReputationAuth: reputationAuth.address,
        addrSAggregatorAuth: sAggregatorAuth.address,
        addrReputation: reputation.address,
        addrSAggregator: sAggregator.address,
        addrFactory: factory.address,
        addrFaucet: faucet.address,
    }

    const content = JSON.stringify(obj, null, 4);
    fs.writeFileSync('../tmp/contract.json', content);

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
    let txThreshold = await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
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

    let txPoapFactory = await registry.setAddressProperty(await property.CONTRACT_POAP_FACTORY(), factory.address);
    await txPoapFactory.wait();

    // transfer to faucet
    const tx = await transferer.sendTransaction({
        to: faucet.address,
        value: ethers.utils.parseEther("1.0")
    });
    await tx.wait();

    let provider = new ethers.providers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
    let balance = await provider.getBalance(faucet.address);
    console.log(`faucet balance is ${ethers.utils.formatEther(balance)} ether`);

    // grant read access
    await rac.superAuth(poapAddr, true);

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