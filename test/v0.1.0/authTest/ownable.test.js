const { ethers } = require('hardhat');
const { expect } = require('chai');

const {
    submit,
    addProof,
    authControl,
    deployCommon,
    deployMockRepution,
    deployMockSAggregator
} = require("../contract.behaviour");

const {
    cType,
    fieldName,
    programHash,
    blankBytes20,
    attester,
    proofInfo,
    submitInfo
} = require("../testVariables");

describe('Ownable Test', () => {
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
    let factory;
    let poap;

    let owner;
    let user1;
    let keeper1;
    let keeper2;
    let keeper3;

    let requestHash;
    let uri = 'test';

    beforeEach(async () => {
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

        const PoapFactory = await ethers.getContractFactory('MockPoapFactory', owner);
        factory = await PoapFactory.deploy(registry.address);
        await factory.deployed();

        // library linking contract
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        // calculate hash variable
        requestHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });

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
        await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

    });

    describe('ZcloakPoap', () => {
        beforeEach(async () => {
            // _paused == true after factory.newPoap(...)
            expect(await poap.paused()).to.equal(true);
        });

        // Must test unpause first, because _paused == true after factory.newPoap(...)
        it('unpause() onlyOwner {}: owner() == _msgSender()', async () => {
            // should fail if owner() != _msgSender()
            await expect(poap.connect(user1).unPause())
                .to.be.revertedWith("Ownable: caller is not the owner");

            // should success if owner() == _msgSender()
            // _owner == factory.address (in ZcloakPoap contract)
            expect(await poap.owner()).to.equal(factory.address);
            await expect(factory.unpause(poap.address))
                .to.emit(poap, 'Unpaused')
                .withArgs(factory.address);
        });

        it('pause() onlyOwner {}: owner() == _msgSender()', async () => {
            // should fail if owner() != _msgSender()
            await expect(poap.connect(user1).pause())
                .to.be.revertedWith("Ownable: caller is not the owner");

            // unpause first, because _paused == true after factory.newPoap(...)
            await factory.unpause(poap.address);
            expect(await poap.paused()).to.equal(false);

            // should success if owner() == _msgSender()
            // _owner == factory.address (in ZcloakPoap contract)
            expect(await poap.owner()).to.equal(factory.address);
            await expect(factory.connect(owner).pause(poap.address))
                .to.emit(poap, 'Paused')
                .withArgs(factory.address);
        });
    });

    describe('Registry', () => {
        it('setUint32Property() onlyOwner {}: owner() == _msgSender()', async () => {
            // should fail if owner() != _msgSender()
            await expect(registry.connect(user1).setUint32Property(property.UINT32_THRESHOLD(), 0))
                .to.be.revertedWith("Ownable: caller is not the owner");

            // should success if owner() == _msgSender()
            await registry.connect(owner).setUint32Property(property.UINT32_THRESHOLD(), 0);
            expect(await registry.uint32Properties(property.UINT32_THRESHOLD())).to.equal(0);
        });

        it('setAddressProperty() onlyOwner {}: owner() == _msgSender()', async () => {
            // should fail if owner() != _msgSender()
            await expect(registry.connect(user1).setAddressProperty(property.CONTRACT_REQUEST(), blankBytes20))
                .to.be.revertedWith("Ownable: caller is not the owner");

            // should success if owner() == _msgSender()
            await registry.connect(owner).setAddressProperty(property.CONTRACT_REQUEST(), blankBytes20);
            expect(await registry.addressProperties(property.CONTRACT_REQUEST())).to.equal(blankBytes20);
        });
    });
});