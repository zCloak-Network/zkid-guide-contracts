const { ethers } = require('hardhat');
const { expect } = require('chai');

const {
    submit,
    addProof,
    authControl,
    deployCommon,
    deployMockRepution,
    deployMockSAggregator
} = require("./contract.behaviour");

const {
    cType,
    fieldName,
    programHash,
    rootHash,
    expectResult,
    isPassed_t,
    attester,
    proofInfo,
    submitInfo
} = require("./testVariables.js");

describe("Poap", function () {
    let registry;
    let property;
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
    let requestHash;
    let outputHash;

    beforeEach(async function () {
        [owner, user1, project, keeper1, keeper2, keeper3] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address];

        let res = await deployCommon(owner, keepers, registry, property, addressesUtils, bytes32sUtils, proof, rac, racAuth, reputationAuth, sAggregatorAuth);
        registry = res.registry;
        property = res.property;
        addressesUtils = res.addressesUtils;
        bytes32sUtils = res.bytes32sUtils;
        proof = res.proof;
        rac = res.rac;
        racAuth = res.racAuth;
        reputationAuth = res.reputationAuth;
        sAggregatorAuth = res.sAggregatorAuth;

        const Faucet = await ethers.getContractFactory('Faucet', owner);
        // const PoapFactory = await ethers.getContractFactory('PoapFactory', owner);
        const PoapFactory = await ethers.getContractFactory('MockPoapFactory', owner);

        faucet = await Faucet.deploy();
        await faucet.deployed();

        factory = await PoapFactory.deploy(registry.address);
        await factory.deployed();

        // library linking contract
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        tx = await owner.sendTransaction({
            to: faucet.address,
            value: ethers.utils.parseEther('100.0')
        });
        await tx.wait();

        // calculate hash variable
        requestHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });
        outputHash = await mockSAggregator.getOutputHash(rootHash, expectResult, isPassed_t, attester);

        // attach an nft contract
        await factory.newPoap(requestHash, uri);
        const ZcloakPoap = await ethers.getContractFactory('ZCloakPoap', owner);
        poap = ZcloakPoap.attach(await factory.connect(user1).rh2poaps(requestHash));

        // AuthControl setting
        await authControl(rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth);

        // registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_POAP_FACTORY(), factory.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);

        // owner set super auth to poap contract
        await rac.superAuth(poap.address, true);

        // user1 add proof first
        await addProof(proof, user1, proofInfo);

        // keeper submit verification result
        await submit(mockSAggregator, [keeper1,keeper2,keeper3], user1, requestHash, [false,true,true], submitInfo);

    });

    describe('ZCloakPoap', function () {

        let popaIdendifier = '40522552889507486262027357734207559572';

        it('claim(): call claim successfully', async function () {
            await poap.connect(user1).claim();
            expect(await poap.totalBalanceOf(popaIdendifier, user1.address)).to.equal(1);

            // should fail if same user claim again
            await expect(poap.connect(user1).claim())
                .to.be.revertedWith("You have already minted");
        });

        it("pause(): should revert if calling factory.pause", async function () {
            // '_paused' variable has been set as true in poap contract's constructor
            await expect(factory.pause(poap.address))
                .to.be.revertedWith("Pausable: paused");
        });
    });

});