///
/// @author vsszhang
/// @dev this test script using hardhat network, the test stream is 
/// proof -> addVerification -> token transfer.
/// @notice isValid() and isPassed() cannot test together.
///
const { ethers } = require("hardhat");

describe("KiltProofsSimple Contract", function () {

    let Registry;
    let registry;

    let Properties;
    let properties;

    let Whitelist;
    let whitelist;

    let KiltProofsV1;
    let kiltProofs;

    let RegulatedTransfer;
    let regulatedTransfer;

    let SampleToken;
    let sampleToken;

    /// @param user the owner of contract who call the contract
    let provider;
    let user;
    let worker;
    let addr1;

    let cType = "0x5ff696698bdbb6415d30e328c2a030b3ddd0c1d2dee8c4d58da4d7ef5a34adc1";
    let programHash = "0xdb70dbc46d57bb7ecb3aa2ceb657592b2c1ab6b427fe1dcd7532d1dcacd24998";
    let proofCid = "QmNRe7jAHu2MXad4f6jDePPCRrpnaRSLGG2fEtHZUoekpD";
    let rootHash = "0xbdf1fd3c489dbf96aa6c7507d3a56957ea1cd5f0bddd1b0222e0a90032d7b0e1";

    beforeEach(async function () {
        
        provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
        user = provider.getSigner(0);
        worker = provider.getSigner(1);
        addr1 = provider.getSigner(2);

        Registry = await ethers.getContractFactory("Registry");
        Properties = await ethers.getContractFactory("Properties");
        Whitelist = await ethers.getContractFactory("Whitelist");
        KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
        RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer");
        SampleToken = await ethers.getContractFactory("SampleToken");

        registry = await Registry.deploy();
        await registry.deployed();

        properties = await Properties.deploy();
        await properties.deployed();

        whitelist = await Whitelist.deploy();
        await whitelist.deployed();

        kiltProofs = await KiltProofsV1.deploy(registry.address);
        await kiltProofs.deployed();

        regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
        await regulatedTransfer.deployed();

        sampleToken = await SampleToken.deploy("zCloak", "ZK");
        await sampleToken.deployed();

    });

    ///TODO: fix the addVerification() bug
    describe("Identity & Authority", function () {
        it("addVerification(): should fail if cannot pass the isWorker modifier", async function () {
            await whitelist.addWorker(worker.getAddress());
            // console.log("worker address: ", await worker.getAddress());

            try {
                await kiltProofs.addVerification(addr1.getAddress(), rootHash, cType, programHash, true);
            } catch (error) {
                console.log(error);
            }

        });

        // it("isValid(): Should fail if cannot pass the isRegistered modifier", async function() {
        //     // contract address and my cType can pass my test
        //     kiltProofs.isValid(kiltProofs.address, cType);
        // });

        // it("isPassed(): Should fail if cannot pass the isRegistered modifier", async function() {
        //     kiltProofs.isPassed(kiltProofs.address, programHash, cType);
        //     console.log(kiltProofs.address);
        // });
    });
});