const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

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
    isPassed_f,
    blankBytes32,
    attester,
    proofInfo,
    submitInfo
} = require("./testVariables.js");

describe("SimpleAggregator API check", function () {
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

    let owner;
    let user1;
    // @param kiltAccountOther: Using it when updateProof.
    let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

    let keeper1;
    let keeper2;
    let keeper3;
    let keeper4;
    let keeper5;
    let keeper6;

    let requestHash;
    let outputHash;

    beforeEach(async function () {
        [ owner, user1, keeper1, keeper2, keeper3, keeper4, keeper5, keeper6 ] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address, keeper4.address, keeper5.address];

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

        // library linking contract
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        // AuthControl setting
        await authControl(rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth);

        // set regisry
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 3);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);

        // user1 add proof first
        await addProof(proof, user1, proofInfo);

        requestHash = await rac.getRequestHash({cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester});
        outputHash = await mockSAggregator.getOutputHash(rootHash, expectResult, isPassed_t, attester);
    });

    describe("keeper submit verification result", function () {
        it("SUCCESS: keeper submit verification result(one keeper)", async function () {
            // check storage value
            let tx = await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);
            assert(await mockSAggregator.getVoterAddress(user1.address, requestHash, outputHash, 0), keeper1.address);
            assert(await mockSAggregator.getVoterIndex(user1.address, requestHash, outputHash, keeper1.address), 0);
            assert(await mockSAggregator.getVoteCount(user1.address, requestHash, outputHash), 1);
            assert(await mockSAggregator.getBytes32ListOutputHash(user1.address, requestHash, 0), outputHash);
            // check reputation storage value
            expect((await mockReputation.getIRutationPoint(requestHash, keeper1.address)).toNumber())
                .to.equal(0);
            expect((await mockReputation.getCReputations(requestHash, keeper1.address)).toNumber())
                .to.equal(1);
            expect((await mockReputation.getKeeperTotalReputations(keeper1.address)).toNumber())
                .to.equal(1);
            expect((await mockReputation.getTotalPoints(requestHash)).toNumber())
                .to.equal(1);

            // should emit 'Reward' event
            expect(tx[0]).to.emit(mockReputation, 'Reward')
                .withArgs(
                    requestHash,
                    keeper1.address,
                    await mockReputation.getIRutationPoint(requestHash, keeper1.address),
                    await mockReputation.getCReputations(requestHash, keeper1.address),
                    await mockReputation.getKeeperTotalReputations(keeper1.address)
                );
        });

        it("SUCCESS: multi-keeper add verification result", async function () {
            await submit(mockSAggregator, [keeper1,keeper2,keeper3,keeper4,keeper5], user1, requestHash, [false,false,true,true,true], submitInfo);

            // check the storage
            expect(await mockSAggregator.getFinalResult(user1.address, requestHash)).to.equal(isPassed_t);
            expect(await mockSAggregator.getFinalOHash(user1.address, requestHash)).to.equal(outputHash);
            expect(await mockSAggregator.getDid(rootHash)).to.equal(user1.address);
            expect((await mockReputation.getKeeperTotalReputations(keeper1.address)).toNumber()).to.equal(-1);
            expect((await mockReputation.getKeeperTotalReputations(keeper2.address)).toNumber()).to.equal(-1);
            expect((await mockReputation.getKeeperTotalReputations(keeper5.address)).toNumber()).to.equal(3);
        });

        it("SUCCESS: first updateProof and then submit", async function () {
            // TODO: new version contract's test sample
        });

        it("STOP: verification result has up to THRESHOLD", async function () {
            // THRESHOLD is 3
            await submit(mockSAggregator, [keeper1,keeper2,keeper3], user1, requestHash, [true,true,true], submitInfo);

            await expect(mockSAggregator.connect(keeper4).submit(user1.address, requestHash, cType, rootHash, isPassed_f, attester, expectResult))
                .to.be.revertedWith("Err: Request task has already been finished");

            await expect(mockSAggregator.connect(keeper5).submit(user1.address, requestHash, cType, rootHash, isPassed_t, attester, expectResult))
                .to.be.revertedWith("Err: Request task has already been finished");
        });

        it("REVERT: keeper submit twice for the same request task", async function () {
            await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);

            await expect(mockSAggregator.connect(keeper1).submit(user1.address, requestHash, cType, rootHash, isPassed_t, attester, expectResult))
                .to.be.revertedWith("Err: keeper can only submit once to the same request task");
        });

        it("REVERT: user use fake attester(keeper is loyal)", async function () {
            let kiltAttester = ethers.utils.formatBytes32String("true_attester");
            await expect(mockSAggregator.connect(keeper1).submit(user1.address, requestHash, cType, rootHash, isPassed_f, kiltAttester, expectResult))
                .to.be.revertedWith("Err: this attestation does not match one which provided by user");
        });
    });

    it('addWorker(address): base on saAuth contract', async function () {
        await expect(sAggregatorAuth.addWorker(keeper6.address))
            .to.emit(sAggregatorAuth, 'AddWorker')
            .withArgs(keeper6.address);
        expect(await sAggregatorAuth.isWorker(keeper6.address)).to.equal(true);
    });

    it('checkAttestation(bytes32,bytes32,bytes32)', async function () {
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(property.UINT32_THRESHOLD())).to.equal(1);
        await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);

        expect(await mockSAggregator.checkAttestation(requestHash, cType, attester)).to.equal(true);
    });

    it('hasSubmitted(address,address,bytes32)', async function () {
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(property.UINT32_THRESHOLD())).to.equal(1);
        await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);

        expect(await mockSAggregator.hasSubmitted(keeper1.address, user1.address, requestHash)).to.equal(true);
        expect(await mockSAggregator.hasSubmitted(keeper2.address, user1.address, requestHash)).to.equal(false);
    });

    it('isFinished(address,bytes32)', async function () {
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(property.UINT32_THRESHOLD())).to.equal(1);
        await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);

        expect(await mockSAggregator.isFinished(user1.address, requestHash)).to.equal(true);
    });

    it('clear(address,bytes32)', async function () {
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
        expect(await registry.uint32Of(property.UINT32_THRESHOLD())).to.equal(2);
        await submit(mockSAggregator, [keeper1,keeper2], user1, requestHash, [true,true], submitInfo);

        await mockSAggregator.clear(user1.address, requestHash);

        // check value
        expect(await mockSAggregator.getMinSubmission(user1.address, requestHash)).to.equal(0);
        // delete arrary Addresses.addresses(votes.keepers), can not read it content
        
        // note: Addresses mapping variable index not deleted, but it affect nothing
        expect(await mockSAggregator.getVoterIndex(user1.address, requestHash, outputHash, keeper1.address)).to.equal(0);
        expect(await mockSAggregator.getVoterIndex(user1.address, requestHash, outputHash, keeper2.address)).to.equal(1);

        expect(await mockSAggregator.getVoteCount(user1.address, requestHash, outputHash)).to.equal(0);
        expect(await mockSAggregator.getFinalResult(user1.address, requestHash)).to.equal(false);
        expect(await mockSAggregator.getFinalTimestamp(user1.address, requestHash)).to.equal(0);
        expect(await mockSAggregator.getFinalOHash(user1.address, requestHash)).to.equal(blankBytes32);
        // delete arrary Addresses.addresses(keeperSubmissions), can not read it content
    });
});