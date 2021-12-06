///
/// @author vsszhang
/// @dev test contract deploy with ethers.js v5.4
///
const { ethers } = require("hardhat");

describe("KiltProofsSimple Contract", function () {
    it("Deployment the KiltProofsSimple contract on the local node", async function () {
        let KiltProofsSimple;
        let testKiltProofs;

        let Properties;
        let testProperties;

        let Registry;
        let testRegistry;

        let Whitelist;
        let testWhiteList;

        let cType = "0x5ff696698bdbb6415d30e328c2a030b3ddd0c1d2dee8c4d58da4d7ef5a34adc1";
        let programHash = "0xdb70dbc46d57bb7ecb3aa2ceb657592b2c1ab6b427fe1dcd7532d1dcacd24998";
        let proofCid = "QmNRe7jAHu2MXad4f6jDePPCRrpnaRSLGG2fEtHZUoekpD";
        let rootHash = "0xbdf1fd3c489dbf96aa6c7507d3a56957ea1cd5f0bddd1b0222e0a90032d7b0e1";

        const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
        const owner = provider.getSigner(0);
        const worker = provider.getSigner(1);
        const addr1 = provider.getSigner(2);


        // Signer and Provider are using ethers.js v5.4
        Registry = await ethers.getContractFactory("Registry");
        Properties = await ethers.getContractFactory("Properties");
        Whitelist = await ethers.getContractFactory("Whitelist");
        KiltProofsSimple = await ethers.getContractFactory("KiltProofsSimple", owner);

        testRegistry = await Registry.deploy();
        await testRegistry.deployed();

        testProperties = await Properties.deploy();
        await testProperties.deployed();

        testWhiteList = await Whitelist.deploy();
        await testWhiteList.deployed();
        //console.log("testWhistlist.signer", testWhistList.signer);

        //KiltProofsSimple.connect(addr1);
        testKiltProofs = await KiltProofsSimple.deploy(testRegistry.address);
        await testKiltProofs.deployed();
        console.log("KiltProofsSimple.signer", KiltProofsSimple.signer);
    });
});