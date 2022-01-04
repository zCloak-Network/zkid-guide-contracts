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
    let oracle;
    let addressesUtiles;

    let owner;
    let user1;
    let checker;
    let project0;
    let project1;
    let project2;
    let project3;

    let txAddRule0;
    let txAddRule1;
    let txAddRule2;
    let txAddRule3;

    beforeEach(async function () {
        [owner, user1, checker, project0, project1, project2, project3] = await ethers.getSigners();

        // contract deploy and library linking
        const Registry = await ethers.getContractFactory("Registry");
        registry = await Registry.deploy();
        await registry.deploy;

        const AddressesUtils = await ethers.getContractFactory("AddressesUtils");
        addressesUtiles = await AddressesUtils.deploy();
        await addressesUtiles.deployed();

        const Oracle = await ethers.getContractFactory("Oracle", {
            libraries: {
                AddressesUtils: addressesUtiles.address,
            },
        });
        oracle = await Oracle.deploy(registry.address);
        await oracle.deployed();

        // owner add all projects in addressesUtils
        txAddRule0 = await oracle.addRule(project0.address, cType, programHash, expectResult, customThreshold);
        txAddRule1 = await oracle.addRule(project1.address, cType, programHash, expectResult, customThreshold);
        txAddRule2 = await oracle.addRule(project2.address, cType, programHash, expectResult, customThreshold);
        txAddRule3 = await oracle.addRule(project3.address, cType, programHash, expectResult, customThreshold);
    });

    describe("Check value", function () {
        it("owner should be contract deployer", async function () {
            expect(await owner.getAddress()).to.equal(await registry.signer.getAddress());
        });

        it("number 2 should be set as custome threshold", async function() {
            // custome threshold should be 2
            expect(await oracle.connect(project0).customThreshold(project0.address)).to.equal(2);
            expect(await oracle.connect(project1).customThreshold(project1.address)).to.equal(2);
            expect(await oracle.connect(project2).customThreshold(project2.address)).to.equal(2);
            expect(await oracle.connect(project3).customThreshold(project3.address)).to.equal(2);
        });

        it("Should success if owner add all projects in addressesUtils", async function() {
            await expect(txAddRule0)
                .to.emit(oracle, 'AddRule')
                .withArgs(project0.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule1)
                .to.emit(oracle, 'AddRule')
                .withArgs(project1.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule2)
                .to.emit(oracle, 'AddRule')
                .withArgs(project2.address, cType, programHash, expectResult, customThreshold);

            await expect(txAddRule3)
                .to.emit(oracle, 'AddRule')
                .withArgs(project3.address, cType, programHash, expectResult, customThreshold);
        });
    });

    describe("Check AddressesUtils", function () {
        it("should pass if content and index are paired after adding", async function () {
            assert.equal(await oracle.judge(0, project0.address, cType, programHash, expectResult), true);
            assert.equal(await oracle.judge(1, project1.address, cType, programHash, expectResult), true);
            assert.equal(await oracle.judge(2, project2.address, cType, programHash, expectResult), true);
            assert.equal(await oracle.judge(3, project3.address, cType, programHash, expectResult), true);
        });

        it("should pass if delete address successfully", async function() {
            // delete address first
            await oracle.deleteRule(project1.address, cType, programHash, expectResult);

            // check the value
            assert.equal(await oracle.judge(0, project0.address, cType, programHash, expectResult), true);
            assert.equal(await oracle.judge(1, project3.address, cType, programHash, expectResult), true);
            assert.equal(await oracle.judge(2, project2.address, cType, programHash, expectResult), true);
            await expect(oracle.judge(3, project3.address, cType, programHash))
                .to.be.reverted;
        });
    });
});