const fs = require('fs');
const { ethers } = require('hardhat');
const { expect } = require('chai');

const sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
const source = JSON.parse(sourceFile);
const abi = source.abi;

describe("MockERC1363(no callback, no param 'data')", function () {
    let registry;
    let properties;
    let addressesUtils;
    let bytes32sUtils;
    let mock;
    let erc1363;
    let rac;
    let mockReputation;
    let mockSAggregator;

    let owner;
    let user1;
    let user2;

    beforeEach(async function () {

        [owner, user1, user2] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory('Registry', owner);
        const Properties = await ethers.getContractFactory('Properties', owner);
        const AddressesUtils = await ethers.getContractFactory('AddressesUtils', owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const RAC = await ethers.getContractFactory('ReadAccessController', owner);
        const MockERC1363 = await ethers.getContractFactory('MockERC1363', owner);

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        addressesUtils = await AddressesUtils.deploy();
        await addressesUtils.deployed();

        bytes32sUtils = await Bytes32sUtils.deploy();
        await bytes32sUtils.deployed();

        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        mock = await MockERC1363.deploy('MyToken', 'MTK');
        await mock.deployed();

        // library linking
        const MockReputation = await ethers.getContractFactory('MockReputation', {
            libraries: {
                AddressesUtils: addressesUtils.address
            }
        }, owner);
        mockReputation = await MockReputation.deploy(registry.address);
        await mockReputation.deployed();

        const MockSAggregator = await ethers.getContractFactory("MockSimpleAggregator", {
            libraries: {
                AddressesUtils: addressesUtils.address,
                Bytes32sUtils: bytes32sUtils.address,
            },
        }, owner);
        mockSAggregator = await MockSAggregator.deploy(registry.address);
        await mockSAggregator.deployed();

        // ERC1363 contract is our token
        erc1363 = new ethers.Contract(mock.address, abi, owner);

        // registry contract
        await registry.setAddressProperty(properties.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(properties.CONTRACT_READ_GATEWAY(), rac.address);
        await registry.setAddressProperty(properties.CONTRACT_AGGREGATOR(), mockSAggregator.address);
    });

    describe('transferAndCall', function () {
        it('Should success if successfully call transferAndCall', async function () {
            expect(await erc1363.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('100.0'));
            expect(await erc1363.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('0.0'));
            let tx = await erc1363['transferAndCall(address,uint256)'](
                user1.address,
                ethers.utils.parseEther('10.0')
            );
            expect(tx)
                .to.emit(erc1363, 'Transfer')
                .withArgs(
                    owner.address,
                    user1.address,
                    ethers.utils.parseEther('10.0')
                );

            expect(await erc1363.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('90.0'));
            expect(await erc1363.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('10.0'));
        });
    });

    describe('transferFromAndCall', function () {
        it('Should success if successfully call transferFromAndCall', async function () {
            await erc1363.connect(owner).approve(user1.address, ethers.utils.parseEther('10.0'));
            expect(await erc1363.allowance(owner.address, user1.address)).to.equal(ethers.utils.parseEther('10.0'));

            let tx = await erc1363.connect(user1)['transferFromAndCall(address,address,uint256)'](
                owner.address,
                user2.address,
                ethers.utils.parseEther('10.0')
            );
            await expect(tx)
                .to.emit(erc1363, 'Transfer')
                .withArgs(owner.address, user2.address, ethers.utils.parseEther('10.0'));

            expect(await erc1363.allowance(owner.address, user1.address)).to.equal(ethers.utils.parseEther('0'));
        });
    });

    describe('approveAndCall', function () {
        it('Should success if successfully call approveAndCall', async function () {
            expect(await erc1363.allowance(owner.address, user1.address)).to.equal(ethers.utils.parseEther('0'));
            let tx = await erc1363['approveAndCall(address,uint256)'](
                user1.address,
                ethers.utils.parseEther('10.0')
            );
            expect(tx)
                .to.emit(erc1363, 'Approval')
                .withArgs(
                    owner.address,
                    user1.address,
                    ethers.utils.parseEther('10.0')
                );
            expect(await erc1363.allowance(owner.address, user1.address)).to.equal(ethers.utils.parseEther('10'));
        });
    });
});