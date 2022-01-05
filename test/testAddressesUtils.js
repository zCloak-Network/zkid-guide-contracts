///
/// @author vsszhang
/// @dev this script just for testing the AddressUtils library
///
const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

const {
    cType,
    programHash,
    expectResult,
    customThreshold
} = require("./testVariables.js");

describe("Library AddressesUtils", function () {
    let registry;
    let kiltOracle;
    let addressesUtiles;

    let owner;
    let user1;
    let project0;
    let project1;
    let project2;
    let project3;

    let txAddRule0;
    let txAddRule1;
    let txAddRule2;
    let txAddRule3;
    let txDeleteRule;

    beforeEach(async function () {
        [owner, user1, project0, project1, project2, project3] = await ethers.getSigners();

        // contract deploy and library linking
        const Registry = await ethers.getContractFactory("Registry");
        registry = await Registry.deploy();
        await registry.deploy;

        const AddressesUtils = await ethers.getContractFactory("AddressesUtils");
        addressesUtiles = await AddressesUtils.deploy();
        await addressesUtiles.deployed();

        const Oracle = await ethers.getContractFactory("KiltOracle", {
            libraries: {
                AddressesUtils: addressesUtiles.address,
            },
        });
        kiltOracle = await Oracle.deploy(registry.address);
        await kiltOracle.deployed();

        // owner add all projects in addressesUtils
        txAddRule0 = await kiltOracle.addRule(project0.address, cType, programHash, expectResult, customThreshold);
        txAddRule1 = await kiltOracle.addRule(project1.address, cType, programHash, expectResult, customThreshold);
        txAddRule2 = await kiltOracle.addRule(project2.address, cType, programHash, expectResult, customThreshold);
        txAddRule3 = await kiltOracle.addRule(project3.address, cType, programHash, expectResult, customThreshold);
    });

    describe("Check value", function () {
        it("owner should be contract deployer", async function () {
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });

        it("number 2 should be set as custome threshold", async function () {
            // custome threshold should be 2
            expect(await kiltOracle.connect(project0).customThreshold(project0.address)).to.equal(2);
            expect(await kiltOracle.connect(project1).customThreshold(project1.address)).to.equal(2);
            expect(await kiltOracle.connect(project2).customThreshold(project2.address)).to.equal(2);
            expect(await kiltOracle.connect(project3).customThreshold(project3.address)).to.equal(2);
        });

        it("Should success if owner add all projects in addressesUtils", async function () {
            // check storage
            assert.equal(await kiltOracle.readAddress(0, cType, programHash, expectResult), project0.address);
            assert.equal(await kiltOracle.readAddress(1, cType, programHash, expectResult), project1.address);
            assert.equal(await kiltOracle.readAddress(2, cType, programHash, expectResult), project2.address);
            assert.equal(await kiltOracle.readAddress(3, cType, programHash, expectResult), project3.address);

            assert.equal(await kiltOracle.readIndex(project0.address, cType, programHash, expectResult), 0);
            assert.equal(await kiltOracle.readIndex(project1.address, cType, programHash, expectResult), 1);
            assert.equal(await kiltOracle.readIndex(project2.address, cType, programHash, expectResult), 2);
            assert.equal(await kiltOracle.readIndex(project3.address, cType, programHash, expectResult), 3);

            // check event emiting
            await expect(txAddRule0)
                .to.emit(kiltOracle, 'AddRule')
                .withArgs(project0.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule1)
                .to.emit(kiltOracle, 'AddRule')
                .withArgs(project1.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule2)
                .to.emit(kiltOracle, 'AddRule')
                .withArgs(project2.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule3)
                .to.emit(kiltOracle, 'AddRule')
                .withArgs(project3.address, cType, programHash, expectResult, customThreshold);
        });
    });

    describe("Check AddressesUtils", function () {
        it("should pass if content and index are paired after adding", async function () {
            assert.equal(await kiltOracle.judge(0, project0.address, cType, programHash, expectResult), true);
            assert.equal(await kiltOracle.judge(1, project1.address, cType, programHash, expectResult), true);
            assert.equal(await kiltOracle.judge(2, project2.address, cType, programHash, expectResult), true);
            assert.equal(await kiltOracle.judge(3, project3.address, cType, programHash, expectResult), true);
        });

        it("should pass if delete address successfully", async function () {
            // delete project1 address first
            txDeleteRule = await kiltOracle.deleteRule(project1.address, cType, programHash, expectResult);
            await expect(txDeleteRule)
                .to.emit(kiltOracle, 'DeleteRule')
                .withArgs(project1.address, cType, programHash, expectResult, 0);

            // check storage
            assert.equal(await kiltOracle.readAddress(0, cType, programHash, expectResult), project0.address);
            assert.equal(await kiltOracle.readAddress(1, cType, programHash, expectResult), project3.address);
            assert.equal(await kiltOracle.readAddress(2, cType, programHash, expectResult), project2.address);
            await expect(kiltOracle.readAddress(3, cType, programHash, expectResult))
                .to.be.reverted;

            assert.equal(await kiltOracle.readIndex(project0.address, cType, programHash, expectResult), 0);
            assert.equal(await kiltOracle.readIndex(project3.address, cType, programHash, expectResult), 1);
            assert.equal(await kiltOracle.readIndex(project2.address, cType, programHash, expectResult), 2);
            assert.equal(await kiltOracle.readIndex(project3.address, cType, programHash, expectResult), 1);

            assert.equal(await kiltOracle.judge(0, project0.address, cType, programHash, expectResult), true);
            assert.equal(await kiltOracle.judge(1, project3.address, cType, programHash, expectResult), true);
            assert.equal(await kiltOracle.judge(2, project2.address, cType, programHash, expectResult), true);
            await expect(kiltOracle.judge(3, project3.address, cType, programHash))
                .to.be.reverted;
        });
    });
});