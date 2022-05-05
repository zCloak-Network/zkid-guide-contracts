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
    isPassed_f,
    blankBytes20,
    blankBytes32
} = require("./testVariables.js");

describe("SimpleAggregator API check", function () {
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
    let alith;

    let rHash;
    let oHash;

    beforeEach(async function () {
        [ owner, user1, keeper1, keeper2, keeper3, keeper4, keeper5, alith ] = await ethers.getSigners();
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
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 3);
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

        rHash = await rac.getRequestHash({cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester});
        oHash = await mockSAggregator.getOutputHash(rootHash, expectResult, isPassed_t, attester);
    });

    describe("keeper submit verification result", function () {
        it("keeper submit verification result(one keeper)", async function () {
            // check storage value
            let tx = await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
            // assert(await mockSAggregator.getKeeperSubmissions(keeper1.address, user1.address, rHash), oHash);
            assert(await mockSAggregator.getVoterAddress(user1.address, rHash, oHash, 0), keeper1.address);
            assert(await mockSAggregator.getVoterIndex(user1.address, rHash, oHash, keeper1.address), 0);
            assert(await mockSAggregator.getVoteCount(user1.address, rHash, oHash), 1);
            assert(await mockSAggregator.getBytes32ListOutputHash(user1.address, rHash, 0), oHash);
            // check reputation storage value
            expect((await mockReputation.getIRutationPoint(rHash, keeper1.address)).toNumber())
                .to.equal(0);
            expect((await mockReputation.getCReputations(rHash, keeper1.address)).toNumber())
                .to.equal(1);
            expect((await mockReputation.getKeeperTotalReputations(keeper1.address)).toNumber())
                .to.equal(1);
            expect((await mockReputation.getTotalPoints(rHash)).toNumber())
                .to.equal(1);

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

        it("multi-keeper add verification result", async function () {
            // verification result is false
            await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_f, attester, expectResult);
            await mockSAggregator.connect(keeper2).submit(user1.address, rHash, cType, rootHash, isPassed_f, attester, expectResult);
            // verification result is true
            await mockSAggregator.connect(keeper3).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
            await mockSAggregator.connect(keeper4).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
            await mockSAggregator.connect(keeper5).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            // check the storage
            expect(await mockSAggregator.getFinalResult(user1.address, rHash)).to.equal(isPassed_t);
            expect(await mockSAggregator.getFinalOHash(user1.address, rHash)).to.equal(oHash);
            expect(await mockSAggregator.getDid(rootHash)).to.equal(user1.address);
            expect((await mockReputation.getKeeperTotalReputations(keeper1.address)).toNumber()).to.equal(-1);
            expect((await mockReputation.getKeeperTotalReputations(keeper2.address)).toNumber()).to.equal(-1);
            expect((await mockReputation.getKeeperTotalReputations(keeper5.address)).toNumber()).to.equal(3);
        });

        it("STOP: verification result has up to THRESHOLD", async function () {
            // THRESHOLD is 3
            await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
            await mockSAggregator.connect(keeper2).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);
            await mockSAggregator.connect(keeper3).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            await expect(mockSAggregator.connect(keeper4).submit(user1.address, rHash, cType, rootHash, isPassed_f, attester, expectResult))
                .to.be.revertedWith("Err: Request task has already been finished");

            await expect(mockSAggregator.connect(keeper5).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult))
                .to.be.revertedWith("Err: Request task has already been finished");
        });

        it("REVERT: keeper submit twice for the same request task", async function () {
            await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            await expect(mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_t, attester, expectResult))
                .to.be.revertedWith("Err: keeper can only submit once to the same request task");
        });

        it("REVERT: user use fake attester(keeper is loyal)", async function () {
            let kiltAttester = ethers.utils.formatBytes32String("true_attester");
            await expect(mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, isPassed_f, kiltAttester, expectResult))
                .to.be.revertedWith("Err: this attestation does not match one which provided by user");
        });
    });

    it('addWorker(address): base on saAuth contract', async function () {
        await expect(sAggregatorAuth.addWorker(alith.address))
            .to.emit(sAggregatorAuth, 'AddWorker')
            .withArgs(alith.address);
        expect(await sAggregatorAuth.isWorker(alith.address)).to.equal(true);
    });

    it('checkAttestation(bytes32,bytes32,bytes32)', async function () {
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(properties.UINT32_THRESHOLD())).to.equal(1);
        await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, true, attester, expectResult);

        expect(await mockSAggregator.checkAttestation(rHash, cType, attester)).to.equal(true);
    });

    it('hasSubmitted(address,address,bytes32)', async function () {
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(properties.UINT32_THRESHOLD())).to.equal(1);
        await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, true, attester, expectResult);

        expect(await mockSAggregator.hasSubmitted(keeper1.address, user1.address, rHash)).to.equal(true);
        expect(await mockSAggregator.hasSubmitted(keeper2.address, user1.address, rHash)).to.equal(false);
    });

    it('isFinished(address,bytes32)', async function () {
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 1);
        expect(await registry.uint32Of(properties.UINT32_THRESHOLD())).to.equal(1);
        await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, true, attester, expectResult);

        expect(await mockSAggregator.isFinished(user1.address, rHash)).to.equal(true);
    });

    it('clear(address,bytes32)', async function () {
        await registry.setUint32Property(properties.UINT32_THRESHOLD(), 2);
        expect(await registry.uint32Of(properties.UINT32_THRESHOLD())).to.equal(2);
        await mockSAggregator.connect(keeper1).submit(user1.address, rHash, cType, rootHash, true, attester, expectResult);
        await mockSAggregator.connect(keeper2).submit(user1.address, rHash, cType, rootHash, true, attester, expectResult);

        await mockSAggregator.clear(user1.address, rHash);

        // check value
        expect(await mockSAggregator.getMinSubmission(user1.address, rHash)).to.equal(0);
        // delete arrary Addresses.addresses(votes.keepers), can not read it content
        
        // note: Addresses mapping variable index not deleted, but it affect nothing
        expect(await mockSAggregator.getVoterIndex(user1.address, rHash, oHash, keeper1.address)).to.equal(0);
        expect(await mockSAggregator.getVoterIndex(user1.address, rHash, oHash, keeper2.address)).to.equal(1);

        expect(await mockSAggregator.getVoteCount(user1.address, rHash, oHash)).to.equal(0);
        expect(await mockSAggregator.getFinalResult(user1.address, rHash)).to.equal(false);
        expect(await mockSAggregator.getFinalTimestamp(user1.address, rHash)).to.equal(0);
        expect(await mockSAggregator.getFinalOHash(user1.address, rHash)).to.equal(blankBytes32);
        // delete arrary Addresses.addresses(keeperSubmissions), can not read it content
    });
});