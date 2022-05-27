const { ethers } = require('hardhat');
const { expect } = require('chai');

describe("Faucet", function () {
    let faucet;

    let owner;
    let user;

    let tx;

    beforeEach(async function () {
        owner = await ethers.getSigner(0);
        user = await ethers.getSigner(1);
        
        const Faucet = await ethers.getContractFactory('Faucet', owner);
        faucet = await Faucet.deploy();
        await faucet.deployed();

        tx = await owner.sendTransaction({
            to: faucet.address,
            value: ethers.utils.parseEther('100.0')
        });
        await tx.wait();
    });

    describe('cliam', function () {
        it('Should emit Cliam event if user can successfully claim ', async function () {
            // console.log(`${ethers.utils.formatEther(await user.getBalance())} DEV`);

            await expect(faucet.connect(user).claim())
                .to.emit(faucet, 'Claim')
                .withArgs(user.address, ethers.utils.parseEther('0.2'));

            // console.log(`${ethers.utils.formatEther(await user.getBalance())} DEV`);
        });

    });

});