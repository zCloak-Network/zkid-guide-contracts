const fs = require('fs');
const { ethers } = require('hardhat');
const { assert, expect } = require('chai');

const {
    cType,
    fieldName,
    programHash,
    expectResult,
} = require('./testVariables')

describe("MockERC1363", function () {
    var registry;
    var properties;
    var mock;
    var erc1363;
    var rac;
    var reputation;
    var project;
    var sAggregator;

    var sourceFile;
    var source;

    var owner;
    var user1;
    var user2;
    var attester;

    beforeEach(async function () {

        [owner, user1, user2, attester] = await ethers.getSigners();
        sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
        source = JSON.parse(sourceFile);
        abi = source.abi;

        const Registry = await ethers.getContractFactory('Registry', owner);
        registry = await Registry.deploy();
        await registry.deployed();

        const Properties = await ethers.getContractFactory('Properties', owner);
        properties = await Properties.deploy();
        await properties.deployed();

        const RAC = await ethers.getContractFactory('ReadAccessController', owner);
        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        const MockERC1363 = await ethers.getContractFactory('MockERC1363', owner);
        mock = await MockERC1363.deploy('MyToken', 'MTK');
        await mock.deployed();

        const ReputationV1 = await ethers.getContractFactory('ReputationV1', owner);
        reputation = await ReputationV1.deploy(registry.address);
        await reputation.deployed();

        const SimpleAggragator = await ethers.getContractFactory('SimpleAggragator', owner);
        sAggregator = await SimpleAggragator.deploy(registry.address);
        await sAggregator.deployed();

        // MockProject contract is our project
        const MockProject = await ethers.getContractFactory('MockProject', owner);
        project = await MockProject.deploy(rac.address);
        await project.deployed();

        // ERC1363 contract is our token
        erc1363 = new ethers.Contract(mock.address, abi, owner);

        // registry contract
        await registry.setAddressProperty(properties.CONTRACT_REWARD(), reputation.address);
        await registry.setAddressProperty(properties.CONTRACT_READ_GATEWAY(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), sAggregator.address);
    });

    describe('transferAndCall', function () {
        it('transferAndCall without data: should emit Transfer event', async function () { });
    });

    describe('transferFromAndCall', function () {
        describe("parameter 'receipt' is human account", function () {
            it('transferFromAndCall without data: should emit Transfer event', async function () {
                await erc1363.connect(owner).approve(user1.address, ethers.utils.parseEther('10.0'));
                var tx = await erc1363.connect(user1)['transferFromAndCall(address,address,uint256)'](
                    owner.address,
                    user2.address,
                    ethers.utils.parseEther('5.0')
                );
                await expect(tx)
                    .to.emit(erc1363, 'Transfer')
                    .withArgs(owner.address, user2.address, ethers.utils.parseEther('5.0'));
            });
            // TODO: when 'to' is RAC addr?
        });

        describe("parameter 'receipt' is RAC address", function () {
            it('transferFromAndCall without data: should emit Transfer event', async function () {
                await rac.connect(owner).initializeRequest(cType, fieldName, programHash, expectResult, attester);
                var rHash = await rac.connect(owner).getRequestHash(cType, fieldName, programHash, expectResult, attester);
                await rac.connect(owner).applyRequest(rHash, project.address, erc1363.address, 1);
                // TODO: keeper should submit

                await erc1363.connect(owner).approve(user1.address, ethers.utils.parseEther('10.0'));
                var tx = await erc1363.connect(user1)['transferFromAndCall(address,address,uint256)'](
                    owner.address,
                    rac.address,
                    ethers.utils.parseEther('5.0')
                );
                await expect(tx)
                    .to.emit(erc1363, 'Transfer')
                    .withArgs(owner.address, user2.address, ethers.utils.parseEther('5.0'));
            });
        });

    });
});