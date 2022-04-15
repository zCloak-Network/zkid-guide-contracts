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

    let rHash;
    let rHashOther;

    beforeEach(async function () {
        [ owner, user1, user2 ] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory("Registry", owner);
        const Properties = await ethers.getContractFactory("Properties", owner);
        const ProofStorage = await ethers.getContractFactory("MockProofStorage", owner);
        const RAC = await ethers.getContractFactory("MockRAC", owner);
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

        rHash = await rac.getRequestHash({cType: cType, fieldName: fieldName, programHash: programHash, attester: attester});
        rHashOther = await rac.getRequestHash({cType: cType, fieldName: fieldName, programHash: newProgramHash, attester: newAttester});
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
            expect((await rac.requestInfo(rHash)).cType).to.equal(blankBytes32);
            expect((await rac.requestInfo(rHash)).fieldName).to.equal(undefined);
            expect((await rac.requestInfo(rHash)).programHash).to.equal(blankBytes32);
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
            assert((await rac.getFieldName(rHash))[0], fieldName[0]);
            assert((await rac.requestInfo(rHash)).programHash, programHash);
            assert((await rac.requestInfo(rHash)).attester, attester);

            expect(await proof.kiltAddr2Addr(kiltAccount)).to.equal(user1.address);
            expect(await proof.getProofCid(user1.address, rHash)).to.equal(proofCid);
            expect(await proof.getCalcResult(user1.address, rHash, 0)).to.equal(expectResult[0]);
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
            let proofExist = await proof.connect(user1).single_proof_exists(user1.address, rHash);
            expect(proofExist).to.equal(true);

            // user1 add same proof again and revert the tx
            await expect(proof.connect(user1).addProof(kiltAccount, attester, cType, fieldName, programHash, proofCid, rootHash, expectResult))
                .to.be.revertedWith("Your proof has already existed, do not add same proof again");

        });

    });

    describe("User update proof", function () {
        it("Should emit 'UpdateProof' event if same user update a new proof successfully", async function () {
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

            let tx = await proof.connect(user1).update_proof(
                kiltAccount,
                rHash,
                newProofCid,
                expectResult
            );
            expect(tx).to.emit(proof, 'UpdateProof')
                .withArgs(user1.addProof, kiltAccount, rHash, newProofCid);

            // check the storage
            expect(await proof.kiltAddr2Addr(kiltAccount)).to.equal(user1.address);
            expect(await proof.getProofCid(user1.address, rHash)).to.equal(newProofCid);
            expect(await proof.getCalcResult(user1.address, rHash, 0)).to.equal(expectResult[0]);
        });

        it("Should success if same user uses another kiltAccount to update a new proof", async function () {
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

            await proof.connect(user1).update_proof(
                kiltAccountOther,
                rHash,
                newProofCid,
                expectResult
            );
            expect(await proof.kiltAddr2Addr(kiltAccountOther)).to.equal(user1.address);
        });
    });

    describe("Multi-user add proof", function () {

        it("Should success if multi-user and their own proof", async function () {
            // user1 add own proof
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
            assert((await rac.requestInfo(rHash)).cType, cType);
            assert((await rac.getFieldName(rHash))[0], fieldName[0]);
            assert((await rac.requestInfo(rHash)).programHash, programHash);
            assert((await rac.requestInfo(rHash)).attester, attester);

            expect(await proof.kiltAddr2Addr(kiltAccount)).to.equal(user1.address);
            expect(await proof.getProofCid(user1.address, rHash)).to.equal(proofCid);
            expect(await proof.getCalcResult(user1.address, rHash, 0)).to.equal(expectResult[0]);

            // check user2's proof storage
            assert((await rac.requestInfo(rHashOther)).cType, cType);
            assert((await rac.getFieldName(rHashOther))[0], fieldName[0]);
            assert((await rac.requestInfo(rHashOther)).programHash, newProgramHash);
            assert((await rac.requestInfo(rHashOther)).attester, attester);

            expect(await proof.kiltAddr2Addr(kiltAccountOther)).to.equal(user2.address);
            expect(await proof.getProofCid(user2.address, rHashOther)).to.equal(newProofCid);
            expect(await proof.getCalcResult(user2.address, rHashOther, 0)).to.equal(expectResult[0]);
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