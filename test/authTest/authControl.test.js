const { ethers } = require('hardhat');
const { expect } = require('chai');

const {
    submit,
    addProof,
    authControl,
    deployCommon,
    deployMockRepution,
    deployMockSAggregator
} = require("../contract.behaviour");

const {
    cType,
    fieldName,
    programHash,
    newProgramHash,
    rootHash,
    expectResult,
    blankBytes20,
    blankBytes32,
    attester,
    kiltAccount,
    proofInfo,
    newProofCid,
    submitInfo
} = require("../testVariables");

describe("AuthControl Test", function () {
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
    let token;

    let owner;
    let user1;
    let project;
    let keeper1;
    let keeper2;
    let keeper3;
    let keepers;

    let requestHash;
    let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

    beforeEach(async function () {
        [owner, user1, project, keeper1, keeper2, keeper3] = await ethers.getSigners();
        keepers = [keeper1.address, keeper2.address, keeper3.address];

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

        // deploy a token contract
        let Token = await ethers.getContractFactory('MockERC1363', owner);
        token = await Token.deploy('vsszhang', 'VSZ');
        await token.deployed();

        // library linking
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        // auth control
        await authControl(rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth);

        // registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 2);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        // get requestHash
        requestHash = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester });
        outputHash = await mockSAggregator.getOutputHash(rootHash, expectResult, true, attester);

        // use1 addProof
        await addProof(proof, user1, proofInfo);
    });

    describe("SimpleAggregator", function () {
        it("submit(...) auth {}: src == owner", async function() {
            // authority != IAuthority(address(0)) && authority.canCall() return false
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // should fail if src != owner
            await expect(submit(mockSAggregator, [user1], user1, requestHash, [true], submitInfo))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            // should pass if src == keeper, this test sample move to 'authority.canCall()'
            await submit(mockSAggregator, [owner], user1, requestHash, [true], submitInfo);
            expect(await mockSAggregator.getKeeperSubmissions(user1.address, requestHash, 0)).to.equal(owner.address);
            expect(await mockSAggregator.getVoterAddress(user1.address, requestHash, outputHash, 0)).to.equal(owner.address);
        });

        it("submit(...) auth {}: authority.canCall() return true", async function() {
            // src != owner && authority != IAuthority(address(0))
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // should fail if caller is not keeper
            expect(await sAggregatorAuth.isWorker(user1.address)).to.equal(false);
            await expect(submit(mockSAggregator, [user1], user1, requestHash, [true], submitInfo))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if caller is keeper
            expect(await sAggregatorAuth.isWorker(keeper1.address)).to.equal(true);
            await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);
            expect(await mockSAggregator.getVoteCount(user1.address, requestHash, outputHash)).to.equal(1);

        });

        it("zkID(...) auth {}: src == owner", async function () {
            // authority != IAuthority(address(0)) && authority.canCall() return false
            await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), blankBytes20);
            expect(await registry.addressOf(property.CONTRACT_READ_GATEWAY())).to.equal(blankBytes20);
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // keepers submit verification first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

            // should fail if src != owner
            await expect(mockSAggregator.connect(user1).zkID(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            await expect(mockSAggregator.connect(keeper1).zkID(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            let [isPassed, calcOutput] = await mockSAggregator.connect(owner).zkID(user1.address, requestHash);
            expect(isPassed).to.equal(true);
            expect((ethers.BigNumber.from(calcOutput[0])).toNumber()).to.equal(submitInfo.expectResult[0]);
        });

        it("zkID(...) auth {}: authority.canCall() return true", async function () {
            // src != owner && authority != IAuthority(address(0))
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // keepers submit verification and set superAuth to user first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);
            await rac.connect(owner).superAuth(user1.address, true);

            // should fail if _src != readGateway
            await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), blankBytes20);
            expect(await registry.addressOf(property.CONTRACT_READ_GATEWAY())).to.equal(blankBytes20);
            await expect(rac.connect(user1).zkID(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if _src == readGateway
            await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);
            expect(await registry.addressOf(property.CONTRACT_READ_GATEWAY())).to.equal(rac.address);
            let [isPassed, calcOutput] = await rac.connect(user1).zkID(user1.address, requestHash);
            expect(isPassed).to.equal(true);
            expect((ethers.BigNumber.from(calcOutput[0])).toNumber()).to.equal(submitInfo.expectResult[0]);
        });

        it("clear(...) auth {}: src == owner", async function () {
            // authority != IAuthority(address(0)) && authority.canCall() return false
            await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), blankBytes20);
            expect(await registry.addressOf(property.CONTRACT_MAIN_KILT())).to.equal(blankBytes20);
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // keepers submit verification first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

            // should fail if src != owner
            await expect(mockSAggregator.connect(user1).clear(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            await expect(mockSAggregator.connect(keeper1).clear(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            await mockSAggregator.connect(owner).clear(user1.address, requestHash);
            expect(await mockSAggregator.getFinalOHash(user1.address, requestHash)).to.equal(blankBytes32);
        });

        it("clear(...) auth {}: authority.canCall() return true", async function () {
            // src != owner && authority != IAuthority(address(0))
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // keepers submit verification first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

            // should fail if _src != proofStorage
            await expect(mockSAggregator.connect(user1).clear(user1.address, requestHash))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if _src == proofStorage
            await proof.unPause();
            await proof.connect(user1).updateProof(kiltAccountOther, requestHash, newProofCid, rootHash, expectResult);
            expect(await mockSAggregator.getFinalOHash(user1.address, requestHash)).to.equal(blankBytes32);
        });
    });

    describe("RAC", function () {
        let requestHashOther;
        let fee;

        beforeEach(async function () {
            // variable setting
            requestHashOther = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: attester });
            fee = ethers.utils.parseEther('2.0');
        });

        it("initializeRequest(...) auth {}: src == owner", async function () {
            // authority != IAuthority(address(0)) && authority.canCall() return false
            await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), blankBytes20);
            expect(await registry.addressOf(property.CONTRACT_MAIN_KILT())).to.equal(blankBytes20);
            expect(await mockSAggregator.authority()).to.equal(sAggregatorAuth.address);

            // should fail if src != owner
            await expect(rac.connect(user1).initializeRequest({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: attester }))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            await expect(rac.connect(keeper1).initializeRequest({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: attester }))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            await rac.connect(owner).initializeRequest({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: attester });
            let bnFieldName = ethers.BigNumber.from((await rac.getFieldName(requestHashOther))[0]).toNumber();
            expect((await rac.requestInfo(requestHashOther)).cType).to.equal(cType);
            expect(bnFieldName).to.equal(fieldName[0]);
            expect((await rac.requestInfo(requestHashOther)).programHash).to.equal(newProgramHash);
            expect((await rac.requestInfo(requestHashOther)).attester).to.equal(attester);
        });

        it("initializeRequest(...) auth {}: authority.canCall() return true", async function () {
            // src != owner && authority != IAuthority(address(0))
            expect(await rac.authority()).to.equal(racAuth.address);

            // should fail if _src != proofStorage
            await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), blankBytes20);
            expect(await registry.addressOf(property.CONTRACT_MAIN_KILT())).to.equal(blankBytes20);
            await expect(rac.connect(user1).initializeRequest({ cType: cType, fieldNames: fieldName, programHash: newProgramHash, attester: attester }))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if _src == proofStorage
            await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
            expect(await registry.addressOf(property.CONTRACT_MAIN_KILT())).to.equal(proof.address);
            
            proofInfo.programHash = newProgramHash;
            await addProof(proof, user1, proofInfo);

            // reset programHash
            proofInfo.programHash = programHash;
        });

        it("applyRequest(...) onlyOwner {}: msg.sender must be owner", async () => {
            // should fail if msg.sender != owner
            await expect(rac.connect(user1).applyRequest(requestHash, project.address, token.address, fee))
                .to.be.reverted;

            // should success if msg.sender == owner
            await rac.connect(owner).applyRequest(requestHash, project.address, token.address, fee);
            expect((await rac.applied(requestHash, project.address)).token).to.equal(token.address);
        });

        it("superAuth(...) onlyOwner {}: msg.sender must be owner", async () => {
            // should fail if msg.sender != owner
            await expect(rac.connect(user1).superAuth(user1.address, true)).to.be.reverted;

            // should success if msg.sender == owner
            await rac.connect(owner).superAuth(user1.address, true);
            expect(await rac.superior(user1.address)).to.equal(true);
        });

        it("zkID(...) accessAllowed {}: applied[][].perVisitFee != 0", async () => {
            // superior[_caller] != false && _caller != address(this)
            expect(await rac.superior(project.address)).to.equal(false);

            // keeper submit verification first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

            // should fail if applied[][].perVisitFee == 0 (not set Meter)
            await expect(rac.connect(project).zkID(user1.address, requestHash)).to.be.revertedWith("No Access");

            // should success if applied[][].perVisitFee != 0
            // set Meter first
            await rac.connect(owner).applyRequest(requestHash, project.address, token.address, fee);
            expect((await rac.applied(requestHash, project.address)).perVisitFee).to.equal(fee);

            // project call zkID
            let [isPassed, calcOutput] = await rac.connect(project).zkID(user1.address, requestHash);
            expect(isPassed).to.equal(true);
            expect(calcOutput[0]).to.equal(expectResult[0]);
        });

        it("zkID(...) accessAllowed {}: superior[_caller] == true", async () => {
            // applied[_requestHash][_caller].perVisitFee == 0 && _caller != address(this)
            expect(await rac.applied(requestHash, project.address).perVisitFee).to.equal(undefined);

            // keeper submit verification first
            await submit(mockSAggregator, [keeper1, keeper2, keeper3], user1, requestHash, [false, true, true], submitInfo);

            // should fail if superior[_caller] == false (not set superAuth for project)
            expect(await rac.superior(project.address)).to.equal(false);
            await expect(rac.connect(project).zkID(user1.address, requestHash)).to.be.revertedWith("No Access");

            // should success if superior[_caller] == true
            // set superAuth for project
            await rac.connect(owner).superAuth(project.address, true);
            expect(await rac.superior(project.address)).to.equal(true);

            // project call zkID
            let [isPassed, calcOutput] = await rac.connect(project).zkID(user1.address, requestHash);
            expect(isPassed).to.equal(true);
            expect(calcOutput[0]).to.equal(expectResult[0]);
        });

        it('zkID(...) accessAllowed {}: _caller == address(this)', async () => {
            // applied[_requestHash][_caller].perVisitFee == 0 && superior[_caller] == false
            // TODO: add test content
        });
    });

    describe("Reputation", () => {
        let IReputation;
        let CReputation;
        let reputations;

        beforeEach(async () => {
            IReputation = await mockReputation.getIReputationPoint(requestHash, keeper1.address);
            CReputation = await mockReputation.getCReputations(requestHash, keeper1.address);
            reputations = await mockReputation.getKeeperTotalReputations(keeper1.address);
        });

        it("addToken(...) onlyOwner {}: msg.sender must be owner", async () => {
            // should fail if msg.sender != owner
            await expect(mockReputation.connect(keeper1).addToken(requestHash, token.address)).to.be.reverted;

            // should success if msg.sender == owner
            await expect(mockReputation.connect(owner).addToken(requestHash, token.address))
                .to.emit(mockReputation, 'Add')
                .withArgs(token.address, owner.address);
            expect(await mockReputation.getToken(requestHash, 0)).to.equal(token.address);
        });

        it("punish(...) auth {}: src == owner", async () => {
            // authority != IAuthority(address(0)) && authority.canCall() return false
            expect(await mockReputation.authority()).to.equal(reputationAuth.address);

            // should fail if src != owner
            await expect(mockReputation.connect(user1).punish(requestHash, keeper1.address))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            // @ notice Cannot call punish() directlly
            // The type of totalPoints[_requestHash] is uint256, uint cannot be nagative
            // (totalPoints[_requestHash] -= (2 * POINT)).
        });

        it("punish(...) auth {}: authority.canCall() return true", async () => {
            // src != owner && authority != IAuthority(address(0))
            expect(await mockReputation.authority()).to.equal(reputationAuth.address);

            // keeper submit (threshold is 2)
            await submit(mockSAggregator, [keeper1, keeper2], user1, requestHash, [false, true], submitInfo);

            // should fail if _src != aggregator
            await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), blankBytes20);
            await expect(submit(mockSAggregator, [keeper3], user1, requestHash, [true], submitInfo))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if _src == aggregator
            await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
            await submit(mockSAggregator, [keeper3], user1, requestHash, [true], submitInfo);
            expect(await mockReputation.getKeeperTotalReputations(keeper1.address)).to.equal(-1);
        });

        it("reward(...) auth {}: src == owner", async () => {
            // authority != IAuthority(address(0)) && authority.canCall return false
            await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), blankBytes20);
            expect(await mockReputation.authority()).to.equal(reputationAuth.address);
            expect(await registry.addressOf(property.CONTRACT_AGGREGATOR())).to.equal(blankBytes20);

            // should fail if src != owner
            await expect(mockReputation.connect(keeper1).reward(requestHash, keeper1.address))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if src == owner
            await expect(mockReputation.connect(owner).reward(requestHash, keeper1.address))
                .to.emit(mockReputation, 'Reward')
                .withArgs(
                    requestHash,
                    keeper1.address,
                    await mockReputation.getIReputationPoint(requestHash, keeper1.address),
                    await mockReputation.getCReputations(requestHash, keeper1.address),
                    await mockReputation.getKeeperTotalReputations(keeper1.address)
                );
        });

        it("reward(...) auth {}: authority.canCall() return true", async () => {
            // src != owner && authority != IAuthority(address(0))
            expect(await mockReputation.authority()).to.equal(reputationAuth.address);

            // should fail if _src != aggregator
            await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), blankBytes20);
            await expect(mockReputation.connect(keeper1).reward(requestHash, keeper1.address))
                .to.be.revertedWith("Auth: you can not pass authorization verification");

            // should success if _src == aggregator
            await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
            await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);
            expect(await mockReputation.getCReputations(requestHash, keeper1.address)).to.equal(1);
            expect(await mockReputation.getKeeperTotalReputations(keeper1.address)).to.equal(1);
            expect(await mockReputation.getTotalPoints(requestHash)).to.equal(1);
        });
    });

});