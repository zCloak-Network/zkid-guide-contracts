///
/// @author vsszhang
/// @dev This is a deploy script, you can run this script to deploy all contract.
/// Also, this script can help you initialize some useful things.
///
const fs = require("fs");
const { ethers } = require("hardhat");
const {
    addrRegistry,
    addrProperties,
    addrAddressesUtils,
    addrBytes32sUtils,
    addrFactory,
    addrSAggregator
} = require('../scripts/moon.json');

async function main() {
    // deploy the contract
    const owner = await ethers.getSigner(0);
    console.log("Contract deploying...\n");

    // deploy new contract
    const Faucet = await ethers.getContractFactory('Faucet', owner);
    const PoapFactory = await ethers.getContractFactory('PoapFactory', owner);

    let faucet = await Faucet.deploy();
    await faucet.deployed();

    let factory = await PoapFactory.deploy(addrRegistry);
    await factory.deployed(addrRegistry);

    const ProofStorage = await ethers.getContractFactory('ProofStorage', owner);
    let proof = await ProofStorage.deploy(addrRegistry);
    await proof.deployed();

    // attach contract
    const Registry = await ethers.getContractFactory("Registry", owner);
    let registry = Registry.attach(addrRegistry);

    const Properties = await ethers.getContractFactory("Properties", owner);
    let property = Properties.attach(addrProperties);

    // library linking contract
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
    let sAggregator = await SAggregator.deploy(addrRegistry);
    await sAggregator.deployed();

    // output result to JSON file
    const obj = {
        addrSAggregator: sAggregator.address,
        addrFaucet: faucet.address,
        addrFactory: factory.address
    }
    const content = JSON.stringify(obj, null, 4);
    fs.writeFileSync('../scripts/contract.json', content, { flag: 'a+' });

    console.log(`contract ProofStorage address: ${proof.address}`);

    // Registry setting
    console.log('Registry setting...\n');
    let txAggregator = await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), sAggregator.address);
    await txAggregator.wait();
    console.log('\tSUCCESS: set CONTRACT_AGGREGATOR');

    let txPopaFactory = await registry.setAddressProperty(property.CONTRACT_POAP_FACTORY(), factory.address);
    await txPopaFactory.wait();
    console.log('\tSUCCESS: set CONTRACT_POAP_FACTORY˜');
    console.log('\nSUCCESS: Deployind and Setting');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });