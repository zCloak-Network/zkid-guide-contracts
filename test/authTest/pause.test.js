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
    rootHash,
    expectResult,
    newProofCid,
    attester,
    proofInfo,
    submitInfo
} = require("../testVariables");

describe('Pause & unPause Test', () => {
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
    let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

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
        it('pause()/unPause() onlyOwner {}: _paused == false', async () => {
            // @notice pause and unPause do not have actual using in ZcloakPoap
            // ZCloakPoap's pause() and unPause() are controled by PoapFactory contract

            // _paused == true after ZCloakPoap constructor
            expect(await poap.paused()).to.equal(true);

            await factory.unpause(poap.address);
            expect(await poap.paused()).to.equal(false);
        });
    });

    describe('ProofStorage', () => {
        it('updateProof() whenNotPaused {}: _paused == false', async () => {
            // pause() and unPause caller == owner, user1 should call updateProof()
            // _paused == true after ProofStrorage constructor
            expect(await proof.paused()).to.equal(true);

            // should fail if _paused == true
            await expect(proof.connect(user1).updateProof(kiltAccountOther, requestHash, newProofCid, rootHash, expectResult))
                .to.be.revertedWith("Pausable: paused");

            // should success if _paused == true
            // unpause first
            await proof.unPause();
            expect(await proof.paused()).to.equal(false);
            
            await expect(proof.connect(user1).updateProof(kiltAccountOther, requestHash, newProofCid, rootHash, expectResult))
                .to.emit(proof, 'AddProof')
                .withArgs(
                    user1.address,
                    attester,
                    cType,
                    programHash,
                    fieldName,
                    newProofCid,
                    requestHash,
                    rootHash,
                    expectResult
                );
        });
    });
});