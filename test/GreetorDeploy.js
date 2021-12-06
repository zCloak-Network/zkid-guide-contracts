const { ethers } = require("hardhat");

describe("Deploy Greetor", function() {
    it("Should fail if the Greeter.sol is unsuccessfully deployment", async function() {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
        const worker = provider.getSigner(2);

        let Greeter = await ethers.getContractFactory("Greeter", worker);
        let greeter = await Greeter.deploy("Hello, world!");
        await greeter.deployed();
        
        console.log("Greeter.signer's address is ", await Greeter.signer.getAddress());
    });
});