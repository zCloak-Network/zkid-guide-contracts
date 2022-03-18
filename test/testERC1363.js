const fs = require('fs');
const { ethers } = require('hardhat');
const { assert, expect } = require('chai');

describe("MockERC1363", function () {
    var registry;
    var mock;
    var erc1363;
    var rac;

    var sourceFile;
    var source;

    var owner;
    var user1;
    var user2;

    beforeEach(async function () {

        [ owner, user1, user2 ] = await ethers.getSigners();
        sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
        source = JSON.parse(sourceFile);
        abi = source.abi;
        
        const Registry = await ethers.getContractFactory('Registry', owner);
        registry = await Registry.deploy();
        await registry.deployed();

        const RAC = await ethers.getContractFactory('ReadAccessController', owner);
        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        const MockERC1363 = await ethers.getContractFactory('MockERC1363', owner);
        mock = await MockERC1363.deploy('MyToken', 'MTK');
        await mock.deployed();

        erc1363 = new ethers.Contract(mock.address, abi, owner);
    });

    describe('transferAndCall', function () {
        it('transferAndCall without data: should emit Transfer event', async function () {});
    });

    describe('transferFromAndCall', function () {
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
});