const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

const {
    cType,
    fieldName,
    programHash,
    newProgramHash,
    proofCid,
    newProofCid,
    rootHash,
    expectResult,
    isPassed_t,
    isPassed_f
} = require("./testVariables.js");

describe("SimpleAggregator Contract", function () {
    let registry;
    let properties;
    let addressesUtils;
    let bytes32sUtils;
    let proof;
    let rac;
    let racAuth;
    let reputation;
    let reputationAuth;
    let sAggregator;
    let sAggregatorAuth;

    let owner;
    let user1;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");

    let worker1;
    let worker2;
    let worker3;
    let worker4;
    let worker5;

    beforeEach(async function () {
        [ owner, user1, worker1, worker2, worker3, worker4, worker5] = await ethers.getSigners();
        let workers = [worker1.address, worker2.address, worker3.address, worker4.address, worker5.address];

        const Registry = await ethers.getContractFactory("Registry", owner);
        const Properties = await ethers.getContractFactory("Properties", owner);
        const AddressesUtils = await ethers.getContractFactory("AddressesUtils", owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
        const RAC = await ethers.getContractFactory("ReadAccessController", owner);
        const RACAuth = await ethers.getContractFactory("RACAuth", owner);
        const ReputationAuth = await ethers.getContractFactory("ReputationAuth", owner);
        const SimpleAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        addressesUtils = await AddressesUtils.deploy();
        await addressesUtils.deployed();

        bytes32sUtils = await Bytes32sUtils.deploy();
        await bytes32sUtils.deployed();

        proof = await ProofStorage.deploy(registry.address);
        await proof.deployed();

        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        racAuth = await RACAuth.deploy(registry.address);
        await racAuth.deployed();

        reputationAuth = await ReputationAuth.deploy(registry.address);
        await reputationAuth.deployed();

        sAggregatorAuth = await SimpleAggregatorAuth.deploy(workers, registry.address);
        await sAggregatorAuth.deployed();

        // library linking contract
        const ReputationV1 = await ethers.getContractFactory("Reputation", {
            libraries: {
                AddressesUtils: addressesUtils.address,
            },
        }, owner);
        reputation = await ReputationV1.deploy(registry.address);
        await reputation.deployed();

        const SimpleAggregator = await ethers.getContractFactory("SimpleAggregator", {
            libraries: {
                AddressesUtils: addressesUtils.address,
                Bytes32sUtils: bytes32sUtils.address,
            },
        }, owner);
        sAggregator = await SimpleAggregator.deploy(registry.address);
        await sAggregator.deployed();

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await sAggregator.setAuthority(sAggregatorAuth.address);
        await reputation.setAuthority(reputationAuth.address);

        // set regisry
        await registry.setUintProperty(properties.UINT32_THRESHOLD(), 3);
        await registry.setAddressProperty(properties.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(properties.CONTRACT_REPUTATION(), reputation.address);
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), sAggregator.address);

        // user1 add proof first
        await proof.connect(user1).addProof(
            kiltAccount,
            attester,
            cType,
            fieldName,
            programHash,
            proofCid,
            rootHash,
            expectResult
        );
    });

    describe("worker submit verify result", function () {
        it("should success if worker submit verify result(one worker)", async function () {
            let rHash = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attester);
            await sAggregator.connect(worker1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester);
            
            // check storage value
            let oHash = await sAggregator.getOutputHash(rootHash, isPassed_t, attester);
            // TODO: add mock contract and set getter function for contract variable(SimpleAggregator.sol)
        });
    });
});