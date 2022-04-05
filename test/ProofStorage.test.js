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
    blankField,
    blankBytes20,
    blankBytes32
} = require("./testVariables.js");

describe("ProofStorage contract", function () {
    let registry;
    let properties;
    let proof;
    let rac;
    let racAuth;

    let owner;
    let user1;
    let user2;
    let attester = ethers.utils.formatBytes32String("attester");
    let newAttester = ethers.utils.formatBytes32String('newAttester');
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

    beforeEach(async function () {
        [ owner, user1, user2 ] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory("Registry", owner);
        const Properties = await ethers.getContractFactory("Properties", owner);
        const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
        const RAC = await ethers.getContractFactory("ReadAccessController", owner);
        const RACAuth = await ethers.getContractFactory("RACAuth", owner);

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        proof = await ProofStorage.deploy(registry.address);
        await proof.deployed();

        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        racAuth = await RACAuth.deploy(registry.address);
        await racAuth.deployed();

        // AuthControl setting
        await rac.setAuthority(racAuth.address);

        // set regisry
        await registry.setAddressProperty(properties.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), proof.address);

    });

    describe("Check value", function () {
        it("RAC should be registried as CONTRACT_REQUESET", async function () {
            expect(await registry.addressOf(properties.CONTRACT_REQUEST()))
                .to.equal(rac.address);
        });

        it("ProofStorage should be registried as CONTRACT_MAIN_KILT", async function () {
            expect(await registry.addressOf(properties.CONTRACT_MAIN_KILT()))
                .to.equal(proof.address);
        });
    });

    describe("User add proof", function () {
        it("user1 can add proof successfully", async function () {
            // storage should be non-empty
            let rHash = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attester);
            expect((await rac.requestInfo(rHash)).cType).to.equal(blankBytes32);
            expect((await rac.requestInfo(rHash)).fieldName).to.equal('');
            expect((await rac.requestInfo(rHash)).programHash).to.equal(blankBytes32);
            expect((await rac.requestInfo(rHash)).expResult).to.equal(false);
            expect((await rac.requestInfo(rHash)).attester).to.equal(blankBytes32);

            // user1 add proof
            const txAddProof = await proof.connect(user1).addProof(
                kiltAccount,
                attester,
                cType,
                fieldName,
                programHash,
                proofCid,
                rootHash,
                expectResult
            );

            // check the event AddProof whether emit or not
            expect(txAddProof)
                .to.emit(proof, 'AddProof')
                .withArgs(
                    user1.address,
                    kiltAccount,
                    attester,
                    cType,
                    programHash,
                    fieldName,
                    proofCid,
                    rootHash,
                    expectResult
                );

            // check whether the proof exist or not
            let proofExist = await proof.connect(user1).single_proof_exists(user1.address, rHash);
            expect(proofExist).to.equal(true);

            // check the storage
            assert((await rac.requestInfo(rHash)).cType, cType);
            assert((await rac.requestInfo(rHash)).fieldName, fieldName);
            assert((await rac.requestInfo(rHash)).programHash, programHash);
            assert((await rac.requestInfo(rHash)).expResult, expectResult);
            assert((await rac.requestInfo(rHash)).attester, attester);
        });

        it("Should fail if user readd the same proof", async function () {
            // user1 add proof
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

            // proof should be added successfully
            let rHash = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attester);
            let proofExist = await proof.connect(user1).single_proof_exists(user1.address, rHash);
            expect(proofExist).to.equal(true);

            // user1 add same proof again and revert the tx
            await expect(proof.connect(user1).addProof(kiltAccount, attester, cType, fieldName, programHash, proofCid, rootHash, expectResult))
                .to.be.revertedWith('Kilt Account Already bounded.');

        });

    });

    describe("User update proof", function () {
        it("Should success if same user update another proof", async function () {
            // user add a proof first
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

            // TODO: so, what proof do u want to update :) ?
            let tx = await proof.connect(user1).update_proof(
                kiltAccount,
                newAttester,
                cType,
                fieldName,
                programHash,
                proofCid,
                rootHash,
                expectResult
            );

            
        });
    });

    describe("Multi-user add proof", function () {

        it("Should success if multi-user and their own proof", async function () {
            // user1 add own proof
            let rHash1 = await rac.getRequestHash(cType, fieldName, programHash, expectResult, attester);
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

            // user2 add own proof
            let rHash2 = await rac.getRequestHash(cType, fieldName, newProgramHash, expectResult, newAttester);
            await proof.connect(user2).addProof(
                kiltAccountOther,
                newAttester,
                cType,
                fieldName,
                newProgramHash,
                newProofCid,
                rootHash,
                expectResult
            );

            // check user1's proof storage
            expect((await rac.requestInfo(rHash1)).cType).to.equal(cType);
            expect((await rac.requestInfo(rHash1)).fieldName).to.equal(fieldName);
            expect((await rac.requestInfo(rHash1)).programHash).to.equal(programHash);
            expect((await rac.requestInfo(rHash1)).expResult).to.equal(expectResult);
            expect((await rac.requestInfo(rHash1)).attester).to.equal(attester);
            expect(await proof.kiltAddr2Addr(kiltAccount)).to.equal(user1.address);
            expect(await proof.proofs(user1.address, rHash1)).to.equal(proofCid);

            // check user2's proof storage
            expect((await rac.requestInfo(rHash2)).cType).to.equal(cType);
            expect((await rac.requestInfo(rHash2)).fieldName).to.equal(fieldName);
            expect((await rac.requestInfo(rHash2)).programHash).to.equal(newProgramHash);
            expect((await rac.requestInfo(rHash2)).expResult).to.equal(expectResult);
            expect((await rac.requestInfo(rHash2)).attester).to.equal(newAttester);
            expect(await proof.kiltAddr2Addr(kiltAccountOther)).to.equal(user2.address);
            expect(await proof.proofs(user2.address, rHash2)).to.equal(newProofCid);
        });

        it("Should revert if user have two kiltAccount and add seme request proof", async function () {
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

            await expect(proof.connect(user1).addProof(
                kiltAccountOther,
                attester,
                cType,
                fieldName,
                programHash,
                proofCid,
                rootHash,
                expectResult
            )).to.be.revertedWith(
                "Your proof has already existed, do not add same proof again"
            );
        });

    });
});