///
/// @author vsszhang
/// @dev this test script using hardhat network, the test stream is 
/// add Proof -> add Verification
///
const { ethers } = require("hardhat");
const { expect } = require("chai");

const { kiltAddress,
    newKiltAddress,
    cType,
    fieldName,
    programHash,
    proofCid,
    newProofCid,
    rootHash,
    expectResult,
    isPassed } = require("./testVariable.js");

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
    });

    describe("Check identity", function() {
        it("owner should be contract deployer", async function() {
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });
    });

    describe("User add proof", function () {
        it("user1 can add proof successfully", async function () {

            // check the DEFAULT_ADMIN_ROLE
            expect(await kilt.hasRole(kilt.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);

            // check the function single_proof_exists()
            expect(await kilt.single_proof_exists(user1.address, cType, programHash)).to.equal(false);

            // user1 add proof
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

            // check whether the proof exist or not
            var proofExist = await kilt.single_proof_exists(user1.address, cType, programHash);
            expect(proofExist).to.equal(true);

        });
    });

    describe("Worker add verification", function () {
        it("worker can verify proof successfully", async function () {

            // set UINT_APPROVE_THRESHOLD as 1
            await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);
            expect(await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).to.equal(1);

            // set CONTRACT_WHITELIST
            await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);
            expect(await registry.addressOf(properties.CONTRACT_WHITELIST())).to.equal(whitelist.address);

            // whitelist addWorker
            await whitelist.addWorker(worker1.address);
            expect(await whitelist.isWorker(worker1.address)).to.equal(true);

            // user1 add proof
            await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

            // check whether the proof exist or not
            var proofExist = await kilt.single_proof_exists(user1.address, cType, programHash);
            expect(proofExist).to.equal(true);

            // check whether the worker1 has submitted or not
            var hasSubmitted = await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash);
            expect(hasSubmitted).to.equal(false);

            // worker1 add verification
            await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed);
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