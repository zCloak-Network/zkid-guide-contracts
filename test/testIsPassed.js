const { ethers } = require("hardhat");

describe("KiltProofsSimple Contract", function() {
    it("isPassed(): Should fail if cannot pass the isRegistered modifier", async function() {
        let cType = '0x5ff696698bdbb6415d30e328c2a030b3ddd0c1d2dee8c4d58da4d7ef5a34adc1';
        let programHash = '0xdb70dbc46d57bb7ecb3aa2ceb657592b2c1ab6b427fe1dcd7532d1dcacd24998';
        //let proofCid = QmNRe7jAHu2MXad4f6jDePPCRrpnaRSLGG2fEtHZUoekpD;
        let rootHash = '0xbdf1fd3c489dbf96aa6c7507d3a56957ea1cd5f0bddd1b0222e0a90032d7b0e1';
        
        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
        const owner = provider.getSigner();

        Whitelist = await ethers.getContractFactory("Whitelist");
        testWhiteList = await Whitelist.deploy();
        await testWhiteList.deployed();

        Registry = await ethers.getContractFactory("Registry");
        testRegistry = await Registry.deploy();
        await testRegistry.deployed();

        KiltProofsSimple = await ethers.getContractFactory("KiltProofsSimple");
        testKiltProofs = await KiltProofsSimple.deploy(testRegistry.address);
        await testKiltProofs.deployed();

        testKiltProofs.isPassed(owner.getAddress(), programHash, cType);
    });
});