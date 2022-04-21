const { ethers } = require('hardhat');
const { assert, expect } = require('chai');

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

describe("Faucet", function () {
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
    let faucet;
    let poap;
    let factory;

    let owner;
    let user1;
    let project;
    let keeper1;
    let keeper2;
    let keeper3;

    let tx;
    let uri = 'test';
    let rHash;
    let oHash;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");

    beforeEach(async function () {
        [owner, user1, project, keeper1, keeper2, keeper3] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address];

        const Registry = await ethers.getContractFactory('Registry', owner);
        const Properties = await ethers.getContractFactory('Properties', owner);
        const AddressesUtils = await ethers.getContractFactory('AddressesUtils', owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
        const RAC = await ethers.getContractFactory('ReadAccessController', owner);
        const RACAuth = await ethers.getContractFactory("RACAuth", owner);
        const ReputationAuth = await ethers.getContractFactory("ReputationAuth", owner);
        const SimpleAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);

        const Faucet = await ethers.getContractFactory('Faucet', owner);
        const PoapFactory = await ethers.getContractFactory('PoapFactory', owner);

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

        faucet = await Faucet.deploy();
        await faucet.deployed();

        factory = await PoapFactory.deploy(registry.address);
        await factory.deployed();

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

        tx = await owner.sendTransaction({
            to: faucet.address,
            value: ethers.utils.parseEther('100.0')
        });
        await tx.wait();

        // calculate hash variable
        rHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });
        oHash = await mockSAggregator.getOutputHash(rootHash, expectResult, isPassed_t, attester);

        // attach an nft contract
        await factory.newPoap(rHash, uri);
        const ZcloakPoap = await ethers.getContractFactory('ZCloakPoap', owner);
        poap = ZcloakPoap.attach(await factory.connect(user1).rh2poaps(rHash));

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await mockSAggregator.setAuthority(sAggregatorAuth.address);
        await mockReputation.setAuthority(reputationAuth.address);

        // registry setting
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 2);
        await registry.setAddressProperty(properties.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(properties.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(properties.CONTRACT_POAP_FACTORY(), factory.address);
        await registry.setAddressProperty(properties.CONTRACT_READ_GATEWAY(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), mockSAggregator.address);

        // owner set super auth to poap contract
        await rac.superAuth(poap.address, true);

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

        // keeper submit verification result
        await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_f, attester, expectResult);
        await mockSAggregator.connect(keeper2).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
        await mockSAggregator.connect(keeper3).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
    });

    describe('ZCloakPoap', function () {
        it('Should pass if project claim successfully', async function () {
            let popaIdendifier = '40522552889507486262027357734207559572';
            await poap.connect(user1).claim();
            expect(await poap.totalBalanceOf(popaIdendifier, user1.address)).to.equal(1);
        });
    });

});