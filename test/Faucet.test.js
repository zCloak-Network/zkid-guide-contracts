const { ethers } = require('hardhat');
const { assert, expect } = require('chai');

describe("Faucet", function () {
    let faucet;
    let token;

    let owner;
    let user;
    let project;

    let tx;

    beforeEach(async function () {
        owner = await ethers.getSigner(0);
        user = await ethers.getSigner(1);
        project = await ethers.getSigner(3);
        
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
        it('Should be pass if user can successfully claim ', async function () {
            // console.log(await user.getBalance());
            await faucet.connect(user).claim();
            // console.log(await user.getBalance());
        });

    });

});