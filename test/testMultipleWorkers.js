///
/// @author vsszhang
/// @dev As we have multiple workers, our contract will... :)
/// In order to keep verified rate is 80%, we set UINT_APPROVE_THRESHOLD default value is 5.
/// The number of workers is 6. Among them, the top 5 workers are honst workers, the 6th worker
/// is an unhonst worker.
///
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const { kiltAddress,
    newKiltAddress,
    cType,
    fieldName,
    programHash,
    proofCid,
    newProofCid,
    rootHash,
    rootHash_new,
    expectResult,
    isPassed_t,
    isPassed_f } = require("./testVariables.js");

describe("Multiple workers condition", function () {
    let registry;
    let properties;
    let whitelist;
    let kilt;

    let owner;
    let user1;
    let worker1;
    let worker2;
    let worker3;
    let worker4;
    let worker5;
    let worker6;

    beforeEach(async function () {
        [owner, user1, worker1, worker2, worker3, worker4, worker5, worker6] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory("Registry");
        const Properties = await ethers.getContractFactory("Properties");
        const Whitelist = await ethers.getContractFactory("Whitelist");
        const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        whitelist = await Whitelist.deploy();
        await whitelist.deployed();

        kilt = await KiltProofsV1.deploy(registry.address);
        await kilt.deployed();

        // set UINT_APPROVE_THRESHOLD as 5
        await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 5);

        // set CONTRACT_WHITELIST in registry
        await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);

        // add worker into whitelist
        await whitelist.addWorker(worker1.address);
        await whitelist.addWorker(worker2.address);
        await whitelist.addWorker(worker3.address);
        await whitelist.addWorker(worker4.address);
        await whitelist.addWorker(worker5.address);
        await whitelist.addWorker(worker6.address);

        // user1 add proof first
        // user's rootHash should be equal to worker's rootHash
        await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

    });

    describe("Check value", function () {
        it("owner should be contract deployer", async function () {
            // owner should be contract deployer
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });

        it("number 5 should be set in UINT_APPROVE_THRESHOLD registry", async function () {
            // thresold should be 5
            expect(await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).to.equal(5);
        });

        it("contract Whitelist'address should be added into CONTRACT_WHITELIST registry", async function() {
            // check whether whitelist address be added into CONTRACT_WHITELIST registry or not
            expect(await registry.addressOf(properties.CONTRACT_WHITELIST())).to.equal(whitelist.address);
        });

        it("worker should be added into whitelist", async function() {
            // check all workers identity
            expect(await whitelist.isWorker(worker1.address)).to.equal(true);
            expect(await whitelist.isWorker(worker2.address)).to.equal(true);
            expect(await whitelist.isWorker(worker3.address)).to.equal(true);
            expect(await whitelist.isWorker(worker4.address)).to.equal(true);
            expect(await whitelist.isWorker(worker5.address)).to.equal(true);
            expect(await whitelist.isWorker(worker6.address)).to.equal(true);
        });

        it("user1 should add proof completely", async function() {
            // check the basic value
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, proofCid);
            expect((await kilt.certificate(user1.address, cType)).kiltAddress).to.equal(kiltAddress);
        });
    });

    describe("Multiple workers conditions", function () {
        it("Condition 1: _finalRootHash should be 'rootHash_new', _isPassed should be 'true'.", async function () {
            // should pass single_proof_exists test
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);

            // @dev worker add verfication,
            // The finalRootHash and isPassed of the top 5 workers are rootHash_new and true,
            // the finalRootHash and isPassed of worker6 are rootHash and false.
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker1).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker2).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker3).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker4).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash_new, cType, programHash), false);
            let txWoker5AddVerification = await kilt.connect(worker5).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash_new, cType, programHash), true);

            // worker6 is an unhonst worker
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash, cType, programHash), false);
            await kilt.connect(worker6).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash, cType, programHash), true);

            // check Event FinalCredential, worker5 should emit FinalCredential event
            // check Event VerificationDone, worker5 should emit VerificationDone event
            // check Event AddVerification, worker5 should emit AddVerification event if he/she call addVerification suceessfully
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'FinalCredential')
                .withArgs(user1.address, cType, rootHash_new);
            
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'VerificationDone')
                .withArgs(user1.address, cType, programHash, isPassed_t);

            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'AddVerification')
                .withArgs(user1.address, worker5.address, rootHash_new, isPassed_t);

            // check storage, finalRootHash should be rootHash_new and isPassed should be isPassed_t
            expect((await kilt.certificate(user1.address, cType)).finalRootHash)
                .to.equal(rootHash_new);

            expect((await kilt.proofs(user1.address, cType, programHash)).isPassed)
                .to.equal(isPassed_t)

        });

        it("Condition 2: _finalRootHash should be 'rootHash_new', _isPassed should be 'false'.", async function() {
            // should pass single_proof_exists test
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);
            
            // @dev worker add verfication,
            // The finalRootHash and isPassed of the top 5 workers are rootHash_new and false,
            // the finalRootHash and isPassed of worker6 are rootHash and true.
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker1).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker2).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker3).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker4).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash_new, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash_new, cType, programHash), false);
            let txWoker5AddVerification = await kilt.connect(worker5).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash_new, cType, programHash), true);

            // worker6 is an unhonst worker
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash, cType, programHash), false);
            await kilt.connect(worker6).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash, cType, programHash), true);

            // check Event FinalCredential, worker5 should emit FinalCredential event
            // check Event VerificationDone, worker5 should emit VerificationDone event
            // check Event AddVerification, worker5 should emit AddVerification event if he/she call addVerification suceessfully
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'FinalCredential')
                .withArgs(user1.address, cType, rootHash_new);
            
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'VerificationDone')
                .withArgs(user1.address, cType, programHash, isPassed_f);

            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'AddVerification')
                .withArgs(user1.address, worker5.address, rootHash_new, isPassed_f);

            // check storage, finalRootHash should be rootHash_new and isPassed should be isPassed_f
            expect((await kilt.certificate(user1.address, cType)).finalRootHash)
                .to.equal(rootHash_new);

            expect((await kilt.proofs(user1.address, cType, programHash)).isPassed)
                .to.equal(isPassed_f);
        });

        it("Condition 3: _finalRootHash should be 'rootHash', _isPassed should be 'true'.", async function() {
            // should pass single_proof_exists test
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);
            
            // @dev worker add verfication,
            // The finalRootHash and isPassed of the top 5 workers are rootHash and true,
            // the finalRootHash and isPassed of worker6 are rootHash_new and false.
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), false);
            await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash, cType, programHash), false);
            await kilt.connect(worker2).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash, cType, programHash), false);
            await kilt.connect(worker3).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash, cType, programHash), false);
            await kilt.connect(worker4).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash, cType, programHash), false);
            let txWoker5AddVerification = await kilt.connect(worker5).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash, cType, programHash), true);

            // worker6 is an unhonst worker
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker6).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash_new, cType, programHash), true);

            // check Event FinalCredential, worker5 should emit FinalCredential event
            // check Event VerificationDone, worker5 should emit VerificationDone event
            // check Event AddVerification, worker5 should emit AddVerification event if he/she call addVerification suceessfully
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'FinalCredential')
                .withArgs(user1.address, cType, rootHash);
            
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'VerificationDone')
                .withArgs(user1.address, cType, programHash, isPassed_t);

            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'AddVerification')
                .withArgs(user1.address, worker5.address, rootHash, isPassed_t);

            // check storage, finalRootHash should be rootHash and isPassed should be isPassed_t
            expect((await kilt.certificate(user1.address, cType)).finalRootHash)
                .to.equal(rootHash);

            expect((await kilt.proofs(user1.address, cType, programHash)).isPassed)
                .to.equal(isPassed_t);
        });

        it("Condition 4: _finalRootHash should be 'rootHash', _isPassed should be 'false'.", async function() {
            // should pass single_proof_exists test
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);
            
            // @dev worker add verfication,
            // The finalRootHash and isPassed of the top 5 workers are rootHash and false,
            // the finalRootHash and isPassed of worker6 are rootHash_new and true.
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), false);
            await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash, cType, programHash), false);
            await kilt.connect(worker2).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash, cType, programHash), false);
            await kilt.connect(worker3).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash, cType, programHash), false);
            await kilt.connect(worker4).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker4.address, rootHash, cType, programHash), true);

            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash, cType, programHash), false);
            let txWoker5AddVerification = await kilt.connect(worker5).addVerification(user1.address, rootHash, cType, programHash, isPassed_f);
            assert.equal(await kilt.hasSubmitted(user1.address, worker5.address, rootHash, cType, programHash), true);

            // worker6 is an unhonst worker
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash_new, cType, programHash), false);
            await kilt.connect(worker6).addVerification(user1.address, rootHash_new, cType, programHash, isPassed_t);
            assert.equal(await kilt.hasSubmitted(user1.address, worker6.address, rootHash_new, cType, programHash), true);

            // check Event FinalCredential, worker5 should emit FinalCredential event
            // check Event VerificationDone, worker5 should emit VerificationDone event
            // check Event AddVerification, worker5 should emit AddVerification event if he/she call addVerification suceessfully
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'FinalCredential')
                .withArgs(user1.address, cType, rootHash);
            
            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'VerificationDone')
                .withArgs(user1.address, cType, programHash, isPassed_f);

            await expect(txWoker5AddVerification)
                .to.emit(kilt.connect(worker5), 'AddVerification')
                .withArgs(user1.address, worker5.address, rootHash, isPassed_f);

            // check storage, finalRootHash should be rootHash and isPassed should be isPassed_f
            expect((await kilt.certificate(user1.address, cType)).finalRootHash)
                .to.equal(rootHash);

            expect((await kilt.proofs(user1.address, cType, programHash)).isPassed)
                .to.equal(isPassed_f);
        });
    });
});