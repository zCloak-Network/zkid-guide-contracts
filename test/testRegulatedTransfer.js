///
/// @author vsszhang
/// @dev this script use for testing RegulatedTransferV1.sol
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

describe("RegulatedTransferV1 contract", function() {
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

    beforeEach(async function() {
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
    });

    describe("Check identity", function() {
        it("owner should be contract deployer", async function() {
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });
    });

    describe("Check function", function() {
        it("owner can call addRule()", async function() {
            // TODO: why grant REGULATED_ERC20 role to regulatedTransfer contract?
            await kilt.grantRole(kilt.REGULATED_ERC20(), regulatedTransfer.address);
            expect(await kilt.hasRole(kilt.REGULATED_ERC20(), regulatedTransfer.address)).to.equal(true);

            await regulatedTransfer.addRule(USDT.address, kilt.address, cType, programHash, expectResult);
            expect(await kilt.trustedPrograms(regulatedTransfer.address, cType)).to.equal(programHash);
        });

        it("user can call rTransfer()", async function() {
            // @dev User1 add a StarkProof, worker1 add a verification.
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

            // @dev Owner call rTransfer(), owner will 'transferFrom' to user1
            // set kilt contract in our registry
            await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);
            expect(await registry.addressOf(properties.CONTRACT_MAIN_KILT())).to.equal(kilt.address);

            // @dev owner transfers some tokens to user1, after that we will use 'rTransfer' function
            // to let user1 transfer some tokens to user2
            await USDT.transfer(user1.address, ethers.utils.parseEther("20.0"));

            // user1 approve RegulatedTransfer contract to let it can use uer1's token transfer to user2
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
            await regulatedTransfer.connect(user1).rTransfer(kilt.address, USDT.address, user2.address, transferAmount, cType, programHash);

            // contract RegulatedTransfer's allowance should be 5
            expect(await USDT.connect(user1).allowance(user1.address, regulatedTransfer.address)).to.equal(await ethers.utils.parseEther("5.0"));

            // user1's USDT token balance should be 15
            expect(await USDT.connect(user1).balanceOf(user1.address)).to.equal(await ethers.utils.parseEther("15.0"));

            // user2's USDT token balance should be 5
            expect(await USDT.balanceOf(user2.address)).to.equal(await ethers.utils.parseEther("5.0"));
        });

    });
});