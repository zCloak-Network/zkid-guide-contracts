///
/// @author vsszhang
/// @dev this is a test script for the z-profile
/// @notice isValid() and isPassed() cannot test together
///
const { JsonRpcProvider } = require("@ethersproject/providers");
const { expect } = require("chai");
const { utils } = require("ethers");
const { ethers } = require("hardhat");

describe("KiltProofsSimple Contract", function() {
    let KiltProofsV1;
    let testKiltProofs;

    let Properties;
    let testProperties;

    let Registry;
    let testRegistry;

    let Whitelist;
    let testWhiteList;

    let RegulatedTransfer;
    let testRegulatedTrnsfer;

    /// @param contractOwner the owner of contract who call the contract
    let contractOwner;
    let worker;
    let addr1;
    
    let cType = "0x5ff696698bdbb6415d30e328c2a030b3ddd0c1d2dee8c4d58da4d7ef5a34adc1";
    let programHash = "0xdb70dbc46d57bb7ecb3aa2ceb657592b2c1ab6b427fe1dcd7532d1dcacd24998";
    let proofCid = "QmNRe7jAHu2MXad4f6jDePPCRrpnaRSLGG2fEtHZUoekpD";
    let rootHash = "0xbdf1fd3c489dbf96aa6c7507d3a56957ea1cd5f0bddd1b0222e0a90032d7b0e1";

    beforeEach(async function (){
        let provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
        contractOwner = provider.getSigner(0);
        worker = provider.getSigner(1);
        addr1 = provider.getSigner(2);

        Registry = await ethers.getContractFactory("Registry");
        Properties = await ethers.getContractFactory("Properties");
        Whitelist = await ethers.getContractFactory("Whitelist");
        KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", contractOwner);
        RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer");

        testRegistry = await Registry.deploy();
        await testRegistry.deployed();

        testProperties = await Properties.deploy();
        await testProperties.deployed();

        testWhiteList = await Whitelist.deploy();
        await testWhiteList.deployed();

        testKiltProofs = await KiltProofsV1.deploy(testRegistry.address);
        await testKiltProofs.deployed();

        testRegulatedTrnsfer = await RegulatedTransfer.deploy(testRegistry.address);
        await testRegulatedTrnsfer.deployed();

    });

    ///TODO: fix the addVerification() bug
    describe("Identity & Authority", function() {
        it("addVerification(): should fail if cannot pass the isWorker modifier", async function() {
            await testWhiteList.addWorker(worker.getAddress());

            try {
                await testKiltProofs.addVerification(addr1.getAddress(), rootHash, cType, programHash, true);
            } catch (error) {
                console.log(error);
            }
            
        });

        // it("isValid(): Should fail if cannot pass the isRegistered modifier", async function() {
        //     // contract address and my cType can pass my test
        //     testKiltProofs.isValid(testKiltProofs.address, cType);
        // });

        // it("isPassed(): Should fail if cannot pass the isRegistered modifier", async function() {
        //     testKiltProofs.isPassed(testKiltProofs.address, programHash, cType);
        //     console.log(testKiltProofs.address);
        // });
    });
});