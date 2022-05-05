const fs = require("fs");
const { ethers } = require('hardhat');
const { expect } = require('chai');

const {
    cType,
    fieldName,
    programHash,
    newProgramHash,
    proofCid,
    newProofCid,
    rootHash,
    expectResult,
    isPassed_t,
    isPassed_f
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
    let user;
    let keeper1;
    let keeper2;
    let keeper3;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let project;

    // variable
    let rHash;
    let data;
    let tokens;

    let sourceFile;
    let source;
    let abi;

    beforeEach(async function () {

        [owner, user, keeper1, keeper2, keeper3, project] = await ethers.getSigners();
        let keepers = [keeper1.address, keeper2.address, keeper3.address];
        sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
        source = JSON.parse(sourceFile);
        abi = source.abi;

        const Registry = await ethers.getContractFactory('Registry', owner);
        const Properties = await ethers.getContractFactory('Properties', owner);
        const AddressesUtils = await ethers.getContractFactory('AddressesUtils', owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
        const RAC = await ethers.getContractFactory('ReadAccessController', owner);
        const RACAuth = await ethers.getContractFactory("RACAuth", owner);
        const ReputationAuth = await ethers.getContractFactory("ReputationAuth", owner);
        const SimpleAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", owner);

        registry = await Registry.deploy();
        await registry.deployed();

        property = await Properties.deploy();
        await property.deployed();

        addressesUtils = await AddressesUtils.deploy();
        await addressesUtils.deployed();

        bytes32sUtils = await Bytes32sUtils.deploy();
        await bytes32sUtils.deployed();

        proof = await ProofStorage.deploy(registry.address);
        await proof.deployed();

        rac = await RAC.deploy(registry.address);
        await rac.deployed();

        racAuth = await RACAuth.deploy(registry.address);
        await racAuth.deployed();

        reputationAuth = await ReputationAuth.deploy(registry.address);
        await reputationAuth.deployed();

        sAggregatorAuth = await SimpleAggregatorAuth.deploy(keepers, registry.address);
        await sAggregatorAuth.deployed();

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

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await mockSAggregator.setAuthority(sAggregatorAuth.address);
        await mockReputation.setAuthority(reputationAuth.address);

        // Registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        // set variable
        rHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });
        data = ethers.utils.hexZeroPad(user.address, 32) + rHash.replace('0x', '');

        // user1 add proof first
        await proof.connect(user).addProof(
            kiltAccount,
            attester,
            cType,
            fieldName,
            programHash,
            proofCid,
            rootHash,
            expectResult
        );
        
    });

    describe("No added token before keeper submit(need transformReputation)", function () {
        beforeEach(async function () {
            // keeper submit verification result
            await mockSAggregator.connect(keeper1)
                .submit(user.address, rHash, cType, rootHash, isPassed_f, attester, expectResult);

            await mockSAggregator.connect(keeper2)
                .submit(user.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            await mockSAggregator.connect(keeper3)
                .submit(user.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            // set meter
            await rac.connect(owner).applyRequest(
                rHash,
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
            await mockReputation.connect(keeper1).batchAdd(rHash, tokens);
        });

        it("claimToken(bytes32,address): bad and good keeper can not claim token(no individualReputation)", async function () {
            await mockReputation.connect(keeper1).claimToken(rHash, MTKA.address);
            await mockReputation.connect(keeper2).claimToken(rHash, MTKA.address);
            await mockReputation.connect(keeper3).claimToken(rHash, MTKA.address);
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(0);
        });

        it("transformReputation(bytes32): call successfullly", async function () {
            // check communityReputations
            expect(await mockReputation.getCReputations(rHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getCReputations(rHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getCReputations(rHash, keeper3.address)).to.equal(2);

            await mockReputation.connect(keeper1).transformReputation(rHash);
            await mockReputation.connect(keeper2).transformReputation(rHash);
            await mockReputation.connect(keeper3).transformReputation(rHash);

            // check communityReputations
            expect(await mockReputation.getCReputations(rHash, keeper1.address)).to.equal(0);
            expect(await mockReputation.getCReputations(rHash, keeper2.address)).to.equal(0);
            expect(await mockReputation.getCReputations(rHash, keeper3.address)).to.equal(0);

            // check individualReputation
            expect(await mockReputation.getIRutationPoint(rHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getIRutationPoint(rHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getIRutationPoint(rHash, keeper3.address)).to.equal(2);
        });

        it("Connectivity Test: first transformReputation last calimToken", async function () {
            // keeper transformReputation first
            await mockReputation.connect(keeper1).transformReputation(rHash);
            await mockReputation.connect(keeper2).transformReputation(rHash);
            await mockReputation.connect(keeper3).transformReputation(rHash);

            // keeper claimToken
            await mockReputation.connect(keeper1).claimToken(rHash, MTKA.address);
            await mockReputation.connect(keeper2).claimToken(rHash, MTKA.address);
            await mockReputation.connect(keeper3).claimToken(rHash, MTKA.address);

            // check keeper balance
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.getRemainingAssets(rHash, MTKA.address)).to.equal(0);

        });

    });

    describe("Already added token before keeper submit(not need transformReputation)", function () {

        let txA;
        let txB;

        beforeEach(async function () {
            // keeper add token in payments
            txA = await mockReputation.addToken(rHash, MTKA.address);
            txB = await mockReputation.addToken(rHash, MTKB.address);

            // keeper submit verification result
            await mockSAggregator.connect(keeper1)
                .submit(user.address, rHash, cType, rootHash, isPassed_f, attester, expectResult);

            await mockSAggregator.connect(keeper2)
                .submit(user.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            await mockSAggregator.connect(keeper3)
                .submit(user.address, rHash, cType, rootHash, isPassed_t, attester, expectResult);

            // set MTKA meter and recharge 12 ether MTKAs to reward pool
            await rac.connect(owner).applyRequest(
                rHash,
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
                rHash,
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
            expect(await mockReputation.getToken(rHash, 0)).to.equal(MTKA.address);
            expect(await mockReputation.getToken(rHash, 1)).to.equal(MTKB.address);

            // check event emiting
            expect(txA).to.emit(mockReputation, 'Add').withArgs(MTKA.address, owner.address);
            expect(txB).to.emit(mockReputation, 'Add').withArgs(MTKB.address, owner.address);
        });

        it("claimToken(bytes32,address): bad and good keeper successfully claim", async function () {
            // check individualReputation
            expect(await mockReputation.getIRutationPoint(rHash, keeper1.address)).to.equal(-1);
            expect(await mockReputation.getIRutationPoint(rHash, keeper2.address)).to.equal(1);
            expect(await mockReputation.getIRutationPoint(rHash, keeper3.address)).to.equal(2);

            // keeper claimToken
            await mockReputation.connect(keeper1).claimToken(rHash, MTKA.address);

            await mockReputation.connect(keeper2).claimToken(rHash, MTKA.address);
            expect(await mockReputation.getRemainingAssets(rHash, MTKA.address)).to.equal(ethers.utils.parseEther('6.0'));

            await mockReputation.connect(keeper3).claimToken(rHash, MTKA.address);
            expect(await mockReputation.getRemainingAssets(rHash, MTKA.address)).to.equal(0);

            // check keeper balance
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(0);
            expect(await MTKA.balanceOf(keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await MTKA.balanceOf(keeper3.address)).to.equal(ethers.utils.parseEther('6.0'));
        });

        it("batchClaim(bytes32): keeper batch claim MTKA and MTKB", async function () {
            await mockReputation.connect(keeper1).batchClaim(rHash);

            await mockReputation.connect(keeper2).batchClaim(rHash);
            expect(await mockReputation.getRemainingAssets(rHash, MTKA.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.getRemainingAssets(rHash, MTKB.address)).to.equal(ethers.utils.parseEther('6.0'));

            await expect(mockReputation.connect(keeper3).batchClaim(rHash))
                .to.emit(mockReputation, 'BatchClaim')
                .withArgs(rHash, keeper3.address);
            expect(await mockReputation.getRemainingAssets(rHash, MTKB.address)).to.equal(0);
            expect(await mockReputation.getRemainingAssets(rHash, MTKB.address)).to.equal(0);

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
            expect(await mockReputation.withdrawable(rHash, MTKA.address, keeper1.address)).to.equal(0);
            expect(await mockReputation.withdrawable(rHash, MTKA.address, keeper2.address)).to.equal(ethers.utils.parseEther('6.0'));
            expect(await mockReputation.withdrawable(rHash, MTKA.address, keeper3.address)).to.equal(ethers.utils.parseEther('12.0'));
        });
    });

    // TODO: same keeper verify other proof(multi-keeper and multi-user)

});