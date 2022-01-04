///
/// @author vsszhang
/// @dev this script use for testing RegulatedTransferV1.sol
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
    expectResult,
    isPassed_t } = require("./testVariables.js");

describe("RegulatedTransferV1 contract", function () {
    let registry;
    let properties;
    let whitelist;
    let kilt;
    let regulatedTransfer;
    let USDT;

    let owner;
    let user1;
    let user2;
    let worker1;
    let worker2;
    let worker3;

    beforeEach(async function () {
        [owner, user1, user2, worker1, worker2, worker3] = await ethers.getSigners();
        const Registry = await ethers.getContractFactory("Registry");
        const Properties = await ethers.getContractFactory("Properties");
        const Whitelist = await ethers.getContractFactory("Whitelist");
        const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
        const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer");
        const SampleToken = await ethers.getContractFactory("SampleToken");

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        whitelist = await Whitelist.deploy();
        await whitelist.deployed();

        kilt = await KiltProofsV1.deploy(registry.address);
        await kilt.deployed();

        regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
        await regulatedTransfer.deployed();

        USDT = await SampleToken.deploy("USDT", "USDT");
        await USDT.deployed();

        // set UINT_APPROVE_THRESHOLD as 1
        await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);

        // set kilt contract in our registry
        await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);

        // set CONTRACT_WHITELIST
        await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);

        // whitelist addWorker
        await whitelist.addWorker(worker1.address);

        // user1 add proof
        await kilt.connect(user1).addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

        // worker1 add verification
        await kilt.connect(worker1).addVerification(user1.address, rootHash, cType, programHash, isPassed_t);

        // token owner transfer 20 USDT tokens to user1
        await USDT.transfer(user1.address, ethers.utils.parseEther("20.0"));
    });

    describe("Check value", function () {
        it("owner should be contract deployer", async function () {
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

        it("contract KiltProofsV1's address should be added into CONTRACT_MAIN_KILT registry", async function() {
            // check whether KiltProofsV1 address be added into CONTRACT_WHITELIST registry or not
            expect(await registry.addressOf(properties.CONTRACT_MAIN_KILT())).to.equal(kilt.address);
        });

        it("contract whitelist'address should be added into CONTRACT_WHITELIST registry", async function() {
            // check whether Whitelist address be added into CONTRACT_WHITELIST registry or not
            expect(await registry.addressOf(properties.CONTRACT_WHITELIST())).to.equal(whitelist.address);
        });

        it("Should success if user can add proof", async function() {
            // the proof should exist
            assert.equal(await kilt.single_proof_exists(user1.address, cType, programHash), true);

            // check the proof storage
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).fieldName, fieldName);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).owner, user1.address);
            assert.equal((await kilt.proofs(user1.address, cType, programHash)).proofCid, proofCid);
        });

        it("Should success if worker can add verification", async function() {
            // the verification should exist
            assert.equal(await kilt.hasSubmitted(user1.address, worker1.address, rootHash, cType, programHash), true);

            // check the certificate storage
            assert.equal((await kilt.certificate(user1.address, cType)).finalRootHash, rootHash);
        });

        it("user1's balance should have 20 USDT tokens", async function() {
            // user1's USDT token balance should be 20
            expect(await USDT.connect(user1).balanceOf(user1.address)).to.equal(await ethers.utils.parseEther("20.0"));
        });
    });

    describe("Check function", function () {
        it("owner can call addRule()", async function () {
            await kilt.grantRole(kilt.REGULATED_ERC20(), regulatedTransfer.address);
            expect(await kilt.hasRole(kilt.REGULATED_ERC20(), regulatedTransfer.address)).to.equal(true);

            await regulatedTransfer.addRule(USDT.address, kilt.address, cType, programHash, expectResult);
            expect(await kilt.trustedPrograms(regulatedTransfer.address, cType)).to.equal(programHash);
        });

        it("user can call rTransfer()", async function () {
            // @dev owner transfers some tokens to user1, after that we will use 'rTransfer' function
            // to let user1 transfer some tokens to user2

            // user1 approve RegulatedTransfer contract to let it can use uer1's token
            var amount = await ethers.utils.parseEther("10.0");
            await USDT.connect(user1).approve(regulatedTransfer.address, amount);

            // contract RegulatedTransfer's allowance should be 10
            expect(await USDT.connect(user1).allowance(user1.address, regulatedTransfer.address)).to.equal(amount);

            // user1's USDT token balance should be 20
            expect(await USDT.connect(user1).balanceOf(user1.address)).to.equal(await ethers.utils.parseEther("20.0"));

            // user2's USDT token balance should be 0
            expect(await USDT.balanceOf(user2.address)).to.equal(await ethers.utils.parseEther("0.0"));

            // contract RegulatedTransfer will transfer user1's 5 tokens to user2
            var transferAmount = await ethers.utils.parseEther("5.0");
            const txUser1RT = await regulatedTransfer.connect(user1).rTransfer(kilt.address, USDT.address, user2.address, transferAmount, cType, programHash);

            // contract RegulatedTransfer's allowance should be 5
            expect(await USDT.connect(user1).allowance(user1.address, regulatedTransfer.address)).to.equal(await ethers.utils.parseEther("5.0"));

            // user1's USDT token balance should be 15
            expect(await USDT.connect(user1).balanceOf(user1.address)).to.equal(await ethers.utils.parseEther("15.0"));

            // user2's USDT token balance should be 5
            expect(await USDT.balanceOf(user2.address)).to.equal(await ethers.utils.parseEther("5.0"));

            // should emit event RTtransfer if user1 successfully 'transferFrom' some tokens to user2
            await expect(txUser1RT)
                .to.emit(regulatedTransfer.connect(user1), "RTransfer")
                .withArgs(USDT.address, user1.address, user2.address, transferAmount, programHash);
        });

        it("Should be no token transfer if contract KiltProofsV1 does not exist in CONTRACT_MAIN_KILT registry", async function() {
            // define a new contract KiltProofsV1 address
            const newAddressKilt = "0x9C03E1943cba0acB35285Ba7b84326332Ac97DEC";

            // user1 approve RegulatedTransfer contract to let it can use uer1's token
            var amount = await ethers.utils.parseEther("10.0");
            await USDT.connect(user1).approve(regulatedTransfer.address, amount);

            // contract RegulatedTransfer's allowance should be 10
            expect(await USDT.connect(user1).allowance(user1.address, regulatedTransfer.address)).to.equal(amount);

            // user2's USDT token balance should be 0
            expect(await USDT.balanceOf(user2.address)).to.equal(await ethers.utils.parseEther("0.0"));

            // contract RegulatedTransfer will transfer user1's 5 tokens to user2
            var transferAmount = await ethers.utils.parseEther("5.0");
            const txUser1RT = await regulatedTransfer.connect(user1).rTransfer(newAddressKilt, USDT.address, user2.address, transferAmount, cType, programHash);

            // contract RegulatedTransfer's allowance should be 10
            expect(await USDT.connect(user1).allowance(user1.address, regulatedTransfer.address)).to.equal(await ethers.utils.parseEther("10.0"));

            // user1's USDT token balance should be 20
            expect(await USDT.connect(user1).balanceOf(user1.address)).to.equal(await ethers.utils.parseEther("20.0"));

            // user2's USDT token balance should be 0
            expect(await USDT.balanceOf(user2.address)).to.equal(await ethers.utils.parseEther("0.0"));
        });

        it("Should fail if user do not add proof", async function() {
            // @dev In this instance, user2 will add no proof in our storage and user2 will call rTransfer function
            // owner transfers 20 USDT tokens to user2 
            await USDT.transfer(user2.address, ethers.utils.parseEther("20.0"));
            assert.equal(await USDT.balanceOf(user2.address), await ethers.utils.parseEther("20.0"));

            // user2 approve RegulatedTransfer contract to let it can use uer2's token
            var amount = await ethers.utils.parseEther("10.0");
            await USDT.connect(user2).approve(regulatedTransfer.address, amount);

            // TODO: check allowance and other
        });
    });
});