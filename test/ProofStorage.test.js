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
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");

    beforeEach(async function () {
        [ owner, user1 ] = await ethers.getSigners();

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
            console.log("blank cType: ", (await rac.requestInfo(rHash)).cType);
            console.log("blank fieldName: ", (await rac.requestInfo(rHash)).fieldName);
            console.log("blank programHash: ", (await rac.requestInfo(rHash)).programHash);
            console.log("blank expResult", (await rac.requestInfo(rHash)).expResult);
            console.log("blank attester", (await rac.requestInfo(rHash)).attester);
            // assert((await rac.requestInfo(rHash)).cType, blankBytes32);
            // assert((await rac.requestInfo(rHash)).fieldName, );
            // assert((await rac.requestInfo(rHash)).programHash, blankBytes32);
            // assert((await rac.requestInfo(rHash)).expResult, "");
            // assert((await rac.requestInfo(rHash)).attester, blankBytes32);

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

    // TODO: need test update_proof
    describe("User update proof", function () {

    });

    // TODO: add muilt-scene test
});