///
/// @author vsszhang
/// @dev this test script using hardhat network, the test stream is 
/// add Proof -> add Verification
///
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const { kiltAddress,
    newKiltAddress,
    cType,
    fieldName,
    programHash,
    newProgramHash,
    proofCid,
    newProofCid,
    rootHash,
    expectResult,
    isPassed_t,
    blankAddress,
    blankField,
    blankRootHash } = require("./testVariables.js");

describe("KiltProofsV1 contract", function () {
    let registry;
    let properties;
    let whitelist;
    let kilt;

    let owner;
    let user1;
    let user2;
    let worker1;
    let worker2;
    let worker3;

    beforeEach(async function () {
        const Registry = await ethers.getContractFactory("Registry");
        const Kilt = await ethers.getContractFactory("KiltProofsV1");
        const Whitelist = await ethers.getContractFactory("Whitelist");
        const Properties = await ethers.getContractFactory("Properties");
        [owner, user1, user2, worker1, worker2, worker3] = await ethers.getSigners();

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        whitelist = await Whitelist.deploy();
        await whitelist.deployed();

        kilt = await Kilt.deploy(registry.address);
        await kilt.deployed();

        // set UINT_APPROVE_THRESHOLD as 1
        await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);

        // set CONTRACT_WHITELIST in registry
        await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);

        // add worker1 into whitelist
        await whitelist.addWorker(worker1.address);

    });

    describe("Check value", function() {
        it("owner should be contract deployer", async function() {
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });

        it("'worker1' should be a recognized worker(be added into whitelist)", async function() {
            // check all workers identity
            expect(await whitelist.isWorker(worker1.address)).to.equal(true);
        });

        it("number 1 should be set in UINT_APPROVE_THRESHOLD registry", async function () {
            // thresold should be 1
            expect(await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).to.equal(1);
        });

        it("contract Whitelist'address should be added into CONTRACT_WHITELIST registry", async function() {
            // check whether whitelist address be added into CONTRACT_WHITELIST registry or not
            expect(await registry.addressOf(properties.CONTRACT_WHITELIST())).to.equal(whitelist.address);
        });

    });

    describe("User add proof", function () {
        it("user1 can add proof successfully", async function () {
            // check the function single_proof_exists()
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(false);

            // check proof storage before add proof
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, blankField);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, blankAddress);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, blankField);

            // user1 add proof
            const txAddProof = await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

            // check the event AddProof whether emit or not
            expect(txAddProof)
                .to.emit(kilt.connect(user1), 'AddProof')
                .withArgs(user1.address, kiltAddress, cType, programHash, fieldName, proofCid, rootHash, expectResult);

            // check whether the proof exist or not
            var proofExist = await kilt.single_proof_exists(user1.address, cType, programHash);
            expect(proofExist).to.equal(true);

            // check proof storage after adding proof
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, proofCid);
        });

        it("Should fail if user readd the same proof", async function() {
            // user1 add proof first
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), false);
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);

            // check proof storage after adding proof
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, proofCid);

            // addProof transaction should be reverted
            await expect(kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult))
                .to.be.revertedWith("Your proof has already existed, do not add same proof again");

            // check proof storage after first adding proof
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, proofCid);
        });

        it("Should success if same user add an new proof with different cType or programHash", async function() {
            // Take different programHash as an example
            // check the function single_proof_exists()
            expect(await kilt.single_proof_exists(user1.address, cType, newProgramHash)).to.equal(false);

            // check proof storage before add proof
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).fieldName, blankField);
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).owner, blankAddress);
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).proofCid, blankField);

            const txAddProof = await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, newProgramHash, proofCid, rootHash, expectResult);
            
            // check the function single_proof_exists()
            expect(await kilt.single_proof_exists(user1.address, cType, newProgramHash)).to.equal(true);

            // should emit event AddProof if add new proof successfully
            await expect(txAddProof)
                .to.emit(kilt.connect(user1), "AddProof")
                .withArgs(user1.address, kiltAddress, cType, newProgramHash, fieldName, proofCid, rootHash, expectResult);

            // check proof storage after adding new proof
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, newProgramHash)).proofCid, proofCid);
        });
    });

    describe("Worker add verification", function () {
        it("worker can verify proof successfully", async function () {
            // user1 add proof
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

            // check whether the proof exist or not
            var proofExist = await kilt.single_proof_exists(user1.address, cType, programHash);
            expect(proofExist).to.equal(true);

            // check whether the worker1 has submitted or not
            var hasSubmitted = await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash);
            expect(hasSubmitted).to.equal(false);

            // check finalRootHash, isFinal and isPassed before add verification
            assert.equal((await kilt.certificate(user1.address, cType)).finalRootHash, blankRootHash);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).isFinal, blankField);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).isPassed, blankField);

            // worker1 add verification
            const txAddVerification = await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);

            // check whether the worker1 has submitted or not
            var hasSubmitted = await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash);
            expect(hasSubmitted).to.equal(true);

            // should emit event FinalCredential if credential's approvedRootHash greater than or equal to threshold
            await expect(txAddVerification)
                .to.emit(kilt.connect(worker1), "FinalCredential")
                .withArgs(user1.address, cType, rootHash);

            // should emit event VerificationDone if proof's approvedCount greater than or equal to threshold
            await expect(txAddVerification)
                .to.emit(kilt.connect(worker1), "VerificationDone")
                .withArgs(user1.address, cType, programHash, isPassed_t);
            
            // check finalRootHash, isFinal and isPassed after adding verification
            assert.equal((await kilt.certificate(user1.address, cType)).finalRootHash, rootHash);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).isFinal, true);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).isPassed, true);
        });

        it("Should fail if worker readd verification", async function() {
            // worker1 add proof first
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), false);
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);
            
            expect(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash)).to.equal(false);
            await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
            expect(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash)).to.equal(true);

            // worker1 readd verification
            // addVerification transaction should be reverted if worker1 readd verification
            await expect(kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t))
                .to.be.revertedWith("you have already submitted");
        });

        it("Should fail if worker add a verification for a non-exist proof", async function() {
            // worker should not submit verification for user1's proof
            expect(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash)).to.equal(false);

            // addVerification transaction should be reverted if the proof do not exist in proof storage
            await expect(kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t))
                .to.be.revertedWith("the Proof does not exist");
        });

        it("Should fail if a non-worker add verification", async function() {
            // worker1 add proof first
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), false);
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);

            // addVerification transcation should be reverted if a non-worker add verification
            await expect(kilt.connect(user2).addVerification(user1.address, rootHash, cType, programHash, isPassed_t))
                .to.be.revertedWith("You are not worker, please check your identity first");
        });
    });

    describe("User update proof", function () {
        it("proofCid is the same twice(function _clear_proof() will be execured)", async function () {
            // add proof first
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(false);
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(true);

            // user1 update proof, function _clear_proof() is execured
            await kilt.connect(user1).update_proof(newKiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

            // verify successful update
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(true);
        });

        it("proofCid is the different twice", async function () {
            // add proof first
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(false);
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(true);

            // user1 update proof, function _clear_proof() is not execured
            await kilt.connect(user1).update_proof(newKiltAddress, cType, fieldName, programHash, newProofCid, rootHash, expectResult);

            // verify successful update
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(true);
        });
    });

});