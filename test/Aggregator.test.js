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
    let mockReputation;
    let reputationAuth;
    let mockSAggregator;
    let sAggregatorAuth;

    let owner;
    let user1;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");

    let keeper1;
    let keeper2;
    let keeper3;
    let keeper4;
    let keeper5;

    beforeEach(async function () {
        [owner, user1, keeper1, keeper2, keeper3, keeper4, keeper5] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address, keeper4.address, keeper5.address];

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

        sAggregatorAuth = await SimpleAggregatorAuth.deploy(keepers, registry.address);
        await sAggregatorAuth.deployed();

        // library linking contract
        const MockReputation = await ethers.getContractFactory("MockReputation", {
            libraries: {
                AddressesUtils: addressesUtils.address
            }
        }, owner);
        mockReputation = await MockReputation.deploy(registry.address);
        await mockReputation.deployed();

        const MockSAggregator = await ethers.getContractFactory("MockSimpleAggregator", {
            libraries: {
                AddressesUtils: addressesUtils.address,
                Bytes32sUtils: bytes32sUtils.address,
            },
        }, owner);
        mockSAggregator = await MockSAggregator.deploy(registry.address);
        await mockSAggregator.deployed();

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await mockSAggregator.setAuthority(sAggregatorAuth.address);
        await mockReputation.setAuthority(reputationAuth.address);

        // set regisry
        await registry.setUintProperty(properties.UINT32_THRESHOLD(), 3);
        await registry.setAddressProperty(properties.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(properties.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), mockSAggregator.address);

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

    describe("keeper submit verification result", function () {
        it("should success if keeper submit verification result(one keeper)", async function () {
            let rHash = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attester);
            let oHash = await mockSAggregator.getOutputHash(rootHash, isPassed_t, attester);

            // check storage value
            let tx = await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester);
            assert(await mockSAggregator.getKeeperSubmissions(keeper1.address, rHash), oHash);
            assert(await mockSAggregator.getVoterAddress(user1.address, rHash, oHash, 0), keeper1.address);
            assert(await mockSAggregator.getVoterIndex(user1.address, rHash, oHash, keeper1.address), 0);
            assert(await mockSAggregator.getVoteCount(user1.address, rHash, oHash), 1);
            assert(await mockSAggregator.getBytes32ListOutputHash(user1.address, rHash, 0), oHash);
            // check reputation storage value
            assert(await mockReputation.getIRutationPoint(rHash, keeper1.address), 1);
            assert(await mockReputation.getKeeperTotalReputations(keeper1.address), 1);

            // should emit 'Reward' event
            expect(tx).to.emit(mockReputation, 'Reward')
                .withArgs(
                    rHash,
                    keeper1.address,
                    await mockReputation.getIRutationPoint(rHash, keeper1.address),
                    await mockReputation.getCReputations(rHash, keeper1.address),
                    await mockReputation.getKeeperTotalReputations(keeper1.address)
                );
        });

        // TODO: add multi-keeper conditions 
        it("", async function () { });
    });
});