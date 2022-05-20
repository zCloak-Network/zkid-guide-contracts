const fs = require("fs");
const { ethers } = require('hardhat');
const { expect } = require('chai');

const {
    submit,
    addProof,
    authControl,
    deployCommon,
    deployMockRepution,
    deployMockSAggregator
} = require("./contract.behaviour");

const {
    cType,
    fieldName,
    programHash,
    proofInfo,
    submitInfo
} = require("./testVariables.js");

describe('Reputation Contract API', function () {

    let registry;
    let property;
    let addressesUtils;
    let bytes32sUtils;
    let proof;
    let rac;
    let racAuth;
    let mockReputation;
    let reputationAuth;
    let mockSAggregator;
    let sAggregatorAuth;
    let MTKA;
    let MTKB;

    // character
    let owner;
    let user1;
    let keeper1;
    let keeper2;
    let keeper3;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let project;

    // variable
    let requestHash;
    let data;
    let tokens;

    let sourceFile;
    let source;
    let abi;

    beforeEach(async function () {

        [owner, user1, keeper1, keeper2, keeper3, project] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address];
        sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
        source = JSON.parse(sourceFile);
        abi = source.abi;

        let res = await deployCommon(owner, keepers, registry, property, addressesUtils, bytes32sUtils, proof, rac, racAuth, reputationAuth, sAggregatorAuth);
        registry = res.registry;
        property = res.property;
        addressesUtils = res.addressesUtils;
        bytes32sUtils = res.bytes32sUtils;
        proof = res.proof;
        rac = res.rac;
        racAuth = res.racAuth;
        reputationAuth = res.reputationAuth;
        sAggregatorAuth = res.sAggregatorAuth;

        // token contract
        const MyTokenA = await ethers.getContractFactory('MockERC1363', project);
        let mockMTKA = await MyTokenA.deploy('MyTokenA', 'MTKA');
        await mockMTKA.deployed();
        MTKA = new ethers.Contract(mockMTKA.address, abi, project);

        const MyTokenB = await ethers.getContractFactory('MockERC1363', project);
        let mockMTKB = await MyTokenB.deploy('MyTokenB', 'MTKB');
        await mockMTKB.deployed();
        MTKB = new ethers.Contract(mockMTKB.address, abi, project);

        // library linking contract
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        // AuthControl setting
        await authControl(rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth);

        // Registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        // set variable
        requestHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });
        data = ethers.utils.hexZeroPad(user1.address, 32) + requestHash.replace('0x', '');

        // user1 add proof first
        await addProof(proof, user1, proofInfo);
        
    });

    describe("No added token before keeper submit(need transformReputation)", function () {
        beforeEach(async function () {
            // keeper submit verification result
            await submit(mockSAggregator, [ keeper1, keeper2, keeper3 ], user1, requestHash, [ false, true, true ], submitInfo);

            // set meter
            await rac.connect(owner).applyRequest(
                requestHash,
                project.address,
                MTKA.address,
                ethers.utils.parseEther('2.0')
            );

            // project recharge 12 ether MTKAs to reward pool
            await MTKA.connect(project)['transferAndCall(address,uint256,bytes)'](
                rac.address,
                ethers.utils.parseEther('12.0'),
                data
            );

            // keeper add token in payments
            tokens = [MTKA.address, MTKB.address];
            await mockReputation.connect(keeper1).batchAdd(requestHash, tokens);
        });

        it("claimToken(bytes32,address): bad and good keeper can not claim token(no individualReputation)", async function () {
            await mockReputation.connect(keeper1).claimToken(requestHash, MTKA.address);
            await mockReputation.connect(keeper2).claimToken(requestHash, MTKA.address);
            await mockReputation.connect(keeper3).claimToken(requestHash, MTKA.address);
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(0);
        });

        it("transformReputation(bytes32): call successfullly", async function () {
            // check communityReputations
            expect(await mockReputation.getCReputations(requestHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getCReputations(requestHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getCReputations(requestHash, keeper3.address)).to.equal(2);

            await mockReputation.connect(keeper1).transformReputation(requestHash);
            await mockReputation.connect(keeper2).transformReputation(requestHash);
            await mockReputation.connect(keeper3).transformReputation(requestHash);

            // check communityReputations
            expect(await mockReputation.getCReputations(requestHash, keeper1.address)).to.equal(0);
            expect(await mockReputation.getCReputations(requestHash, keeper2.address)).to.equal(0);
            expect(await mockReputation.getCReputations(requestHash, keeper3.address)).to.equal(0);

            // check individualReputation
            expect(await mockReputation.getIReputationPoint(requestHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getIReputationPoint(requestHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getIReputationPoint(requestHash, keeper3.address)).to.equal(2);
        });

        it("Connectivity Test: first transformReputation last calimToken", async function () {
            // keeper transformReputation first
            await mockReputation.connect(keeper1).transformReputation(requestHash);
            await mockReputation.connect(keeper2).transformReputation(requestHash);
            await mockReputation.connect(keeper3).transformReputation(requestHash);

            // keeper claimToken
            await mockReputation.connect(keeper1).claimToken(requestHash, MTKA.address);
            await mockReputation.connect(keeper2).claimToken(requestHash, MTKA.address);
            await mockReputation.connect(keeper3).claimToken(requestHash, MTKA.address);

            // check keeper balance
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.getRemainingAssets(requestHash, MTKA.address)).to.equal(0);

        });

    });

    describe("Already added token before keeper submit(not need transformReputation)", function () {

        let txA;
        let txB;

        beforeEach(async function () {
            // keeper add token in payments
            txA = await mockReputation.addToken(requestHash, MTKA.address);
            txB = await mockReputation.addToken(requestHash, MTKB.address);

            // keeper submit verification result
            await submit(mockSAggregator, [ keeper1, keeper2, keeper3 ], user1, requestHash, [ false, true, true ], submitInfo);

            // set MTKA meter and recharge 12 ether MTKAs to reward pool
            await rac.connect(owner).applyRequest(
                requestHash,
                project.address,
                MTKA.address,
                ethers.utils.parseEther('2.0')
            );
            await MTKA.connect(project)['transferAndCall(address,uint256,bytes)'](
                rac.address,
                ethers.utils.parseEther('12.0'),
                data
            );

            // set MTKB meter and recharge 12 ether MTKBs to reward pool
            await rac.connect(owner).applyRequest(
                requestHash,
                project.address,
                MTKB.address,
                ethers.utils.parseEther('2.0')
            );
            await MTKB.connect(project)['transferAndCall(address,uint256,bytes)'](
                rac.address,
                ethers.utils.parseEther('12.0'),
                data
            );

        });

        it("addToken(bytes32,address): call addToken successfully", async function () {
            // check token
            expect(await mockReputation.getToken(requestHash, 0)).to.equal(MTKA.address);
            expect(await mockReputation.getToken(requestHash, 1)).to.equal(MTKB.address);

            // check event emiting
            expect(txA).to.emit(mockReputation, 'Add').withArgs(MTKA.address, owner.address);
            expect(txB).to.emit(mockReputation, 'Add').withArgs(MTKB.address, owner.address);
        });

        it("claimToken(bytes32,address): bad and good keeper successfully claim", async function () {
            // check individualReputation
            expect(await mockReputation.getIReputationPoint(requestHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getIReputationPoint(requestHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getIReputationPoint(requestHash, keeper3.address)).to.equal(2);

            // keeper claimToken
            await mockReputation.connect(keeper1).claimToken(requestHash, MTKA.address);

            await mockReputation.connect(keeper2).claimToken(requestHash, MTKA.address);
            expect(await mockReputation.getRemainingAssets(requestHash, MTKA.address)).to.equal(ethers.utils.parseEther('6.0'));

            await mockReputation.connect(keeper3).claimToken(requestHash, MTKA.address);
            expect(await mockReputation.getRemainingAssets(requestHash, MTKA.address)).to.equal(0);

            // check keeper balance
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));
        });

        it("batchClaim(bytes32): keeper batch claim MTKA and MTKB", async function () {
            await mockReputation.connect(keeper1).batchClaim(requestHash);

            await mockReputation.connect(keeper2).batchClaim(requestHash);
            expect(await mockReputation.getRemainingAssets(requestHash, MTKA.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.getRemainingAssets(requestHash, MTKB.address)).to.equal(ethers.utils.parseEther('6.0'));

            await expect(mockReputation.connect(keeper3).batchClaim(requestHash))
                .to.emit(mockReputation, 'BatchClaim')
                .withArgs(requestHash, keeper3.address);
            expect(await mockReputation.getRemainingAssets(requestHash, MTKB.address)).to.equal(0);
            expect(await mockReputation.getRemainingAssets(requestHash, MTKB.address)).to.equal(0);

            // check keeper balance
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));

            expect(await MTKB.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKB.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKB.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));
        });

        it("onTransferReceived(address,address,uint256,bytes): fail if _operator != readGateway", async function () {
            await expect(MTKA.connect(project)['transferAndCall(address,uint256,bytes)'](
                mockReputation.address,
                ethers.utils.parseEther('2.0'),
                data
            )).to.be.revertedWith("ERC1363: _checkAndCallTransfer reverts");
        });

        it("withdrawable(bytes32,address,address): check keeper withdraw number", async function () {
            expect(await mockReputation.withdrawable(requestHash, MTKA.address, keeper1.address)).to.equal(0);
            expect(await mockReputation.withdrawable(requestHash, MTKA.address, keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.withdrawable(requestHash, MTKA.address, keeper3.address)).to.equal(ethers.utils.parseEther('12.0'));
        });
    });

    // TODO: same keeper verify other proof(multi-keeper and multi-user)

});