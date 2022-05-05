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
    let sa;
    let saAuth;
    let addressesUtils;
    let bytes32sUtils;

    let owner;
    let user1;
    let user2;
    let keeper1;
    let keeper2;
    let keeper3;
    let attester = ethers.utils.formatBytes32String("attester");
    let newAttester = ethers.utils.formatBytes32String('newAttester');
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

    let rHash;
    let rHashOther;

    beforeEach(async function () {
        [owner, user1, user2, keeper1, keeper2, keeper3] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address];

        const Registry = await ethers.getContractFactory("Registry", owner);
        const Properties = await ethers.getContractFactory("Properties", owner);
        const AddressesUtils = await ethers.getContractFactory("AddressesUtils", owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const ProofStorage = await ethers.getContractFactory("MockProofStorage", owner);
        const RAC = await ethers.getContractFactory("MockRAC", owner);
        const RACAuth = await ethers.getContractFactory("RACAuth", owner);
        const SAAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);

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

        saAuth = await SAAuth.deploy(keepers, registry.address);
        await saAuth.deployed();

        // library linking
        const MockSAggregator = await ethers.getContractFactory(
            "MockSimpleAggregator",
            {
                libraries: {
                    AddressesUtils: addressesUtils.address,
                    Bytes32sUtils: bytes32sUtils.address,
                },
            },
            owner
        );
        sa = await MockSAggregator.deploy(registry.address);
        await sa.deployed();

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await sa.setAuthority(saAuth.address);

        // set regisry
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), sa.address);
        await registry.setAddressProperty(properties.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), proof.address);

        rHash = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester });
        rHashOther = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: newAttester });
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
                    attester,
                    cType,
                    programHash,
                    fieldName,
                    proofCid,
                    rHash,
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

            // owner execute unPause
            await proof.unPause();

            await proof.connect(user1).updateProof(
                kiltAccountOther,
                rHash,
                newProofCid,
                rootHash,
                expectResult
            );
            expect(await proof.kiltAddr2Addr(kiltAccountOther)).to.equal(user1.address);
        });

        it('should updateProof fail if owner switch off pause', async function () {
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

            // owner switch on pause
            await proof.unPause();

            await proof.connect(user1).updateProof(
                kiltAccountOther,
                rHash,
                newProofCid,
                rootHash,
                expectResult
            );

            // owner switch off pause
            await proof.pause();

            await expect(proof.connect(user1).updateProof(
                kiltAccountOther,
                rHash,
                newProofCid,
                rootHash,
                expectResult
            )).to.be.revertedWith('Pausable: paused');
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