///
/// @author vsszhang
/// @dev this test script checks whether Oracle contract can read proofs storage
///
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const { 
    kiltAddress,
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
    blankRootHash
} = require("./testVariables.js");

describe("Oracle contract", function() {
    let registry;
    let properties;
    let kilt;
    let kiltAuth;
    let oracle;
    let addressesUtils;

    let owner;
    let user1;
    let worker1;
    let worker2;
    let worker3;
    let project1;

    let txSetAuthority;
    let txIsValid;

    beforeEach(async function() {
        [owner, user1, worker1, worker2, worker3, project1] = await ethers.getSigners();
        var workers = [worker1.address, worker2.address, worker3.address];

        const Registry = await ethers.getContractFactory("Registry");
        const Properties = await ethers.getContractFactory("Properties");
        const Kilt = await ethers.getContractFactory("KiltProofsV1");
        const KiltProofsAuth = await ethers.getContractFactory("KiltProofsAuth");
        
        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        kilt = await Kilt.deploy(registry.address);
        await kilt.deployed();

        kiltAuth = await KiltProofsAuth.deploy(workers, registry.address);
        await kiltAuth.deployed();

        // library linking and contract 'Oracle' deploying
        const AddressesUtils = await ethers.getContractFactory("AddressesUtils");
        addressesUtils = await AddressesUtils.deploy();
        await addressesUtils.deployed();

        const Oracle = await ethers.getContractFactory("Oracle", {
            libraries: {
                AddressesUtils: addressesUtils.address,
            },
        });
        oracle = await Oracle.deploy(registry.address);
        await oracle.deployed();

        // set KiltProofsAuth as authority
        txSetAuthority = await kilt.setAuthority(kiltAuth.address);

        // set UINT_APPROVE_THRESHOLD as 1
        await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);

        // set contract Oracle address into CONTRACT_ORACLE registry
        await registry.setAddressProperty(properties.CONTRACT_ORACLE(), oracle.address);

        // set contract KiltProofsV1 address into CONTRACT_MAIN_KILT registry
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);

        // user1 add proof
        await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

        // worker1, worker2 and worker3 verify proof
        await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
        await kilt.connect(worker2).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);
        await kilt.connect(worker3).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);

    });

    describe("Check value", function() {
        it("owner should be contract deployer", async function() {
            expect(await owner.address).to.equal(await registry.signer.getAddress());
        });

        it("KiltProofsAuth should be set as authority", async function() {
            // should emit event LogSetAuthority if setAuthority suceessfully
            await expect(txSetAuthority)
                .to.emit(kilt, 'LogSetAuthority')
                .withArgs(kiltAuth.address);
        });

        it("'worker1', 'worker2' and 'worker3' should be a recognized worker", async function() {
            // check all workers identity
            expect(await kiltAuth.isWorker(worker1.address)).to.equal(true);
            expect(await kiltAuth.isWorker(worker2.address)).to.equal(true);
            expect(await kiltAuth.isWorker(worker3.address)).to.equal(true);
        });

        it("number 2 should be set as custome threshold", async function() {
            // custome threshold should be 2
            expect(await oracle.connect(project1).customThreshold(project1.address)).to.equal(2);
        });

        it("number 1 should be set in UINT_APPROVE_THRESHOLD registry", async function () {
            // thresold should be 1
            expect(await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).to.equal(1);
        });

        it("Oracle address should be added in CONTRACT_ORACLE registry", async function() {
            // Oracle address should be added in CONTRACT_ORACLE registry
            expect(await registry.addressOf(properties.CONTRACT_ORACLE())).to.equal(oracle.address);
        });

        it("KiltProofsV1 address should be added in CONTRACT_MAIN_KILT", async function() {
            // KiltProofsV1 address should be added in CONTRACT_MAIN_KILT
            expect(await registry.addressOf(properties.CONTRACT_MAIN_KILT())).to.equal(kilt.address);
        });
    });

    describe("Check addProof and addVerification", function() {
        it("Should pass if user1 add proof successfully", async function() {
            // check if the proof has been set
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);
        });

        it("Should pass if three workers add verification successfully", async function() {
            // whether worker add verification successfully or not
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), true);
            assert.equal(await kilt.hasSubmitted(user1.address, worker2.address, rootHash, cType, programHash), true);
            assert.equal(await kilt.hasSubmitted(user1.address, worker3.address, rootHash, cType, programHash), true);
        });
    });

    describe("Check whether contract Oracle can read proof storage or not", function() {
        it("Should pass if project1 call function isValid successfully", async function() {
            txIsValid = await oracle.connect(project1).isValid(user1.address, cType, programHash, expectResult);
            expect(txIsValid).to.equal(true);
        });
    });
});