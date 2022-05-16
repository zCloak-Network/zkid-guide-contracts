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
    expectResult,
    attester,
    proofInfo,
    submitInfo
} = require("./testVariables.js");

const sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
const source = JSON.parse(sourceFile);
const abi = source.abi;

describe('RAC Contract', function () {

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
    let MTK;

    // character
    let owner;
    let user1;
    let keeper1;
    let project;

    // variable
    let requestHash;
    let data;

    beforeEach(async function () {
        [owner, user1, keeper1, project] = await ethers.getSigners();
        let keepers = [keeper1.address];

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
        MTK = new ethers.Contract(mockMTKA.address, abi, project);

        // library linking contract
        mockReputation = await deployMockRepution(owner, mockReputation, addressesUtils, registry);
        mockSAggregator = await deployMockSAggregator(owner, mockSAggregator, addressesUtils, bytes32sUtils, registry);

        // AuthControl setting
        await authControl(rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth);

        // Registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        // get requestHash
        requestHash = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester });
        data = ethers.utils.hexZeroPad(user1.address, 32) + requestHash.replace('0x', '');
    });

    describe("API functional test", function () {
        it('applyRequest(bytes32,address,address,uint256)', async function () {
            await rac.applyRequest(requestHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));
            expect((await rac.applied(requestHash, project.address)).token).to.equal(MTK.address);
            expect((await rac.applied(requestHash, project.address)).perVisitFee).to.equal(ethers.utils.parseEther('2.0'));
        });

        it('exists(bytes32)', async function () {
            expect(await rac.exists(requestHash)).to.equal(false);
            await addProof(proof, user1, proofInfo);
            expect((await rac.requestInfo(requestHash)).cType).to.equal(cType);
            expect(await rac.exists(requestHash)).to.equal(true);
        });

        it('requestMetadata(bytes32)', async function () {
            await addProof(proof, user1, proofInfo);
            expect((await rac.requestMetadata(requestHash)).cType).to.equal(cType);
            expect((await rac.getFieldName(requestHash))[0]).to.equal(fieldName[0]);
            expect((await rac.requestMetadata(requestHash)).programHash).to.equal(programHash);
            expect((await rac.requestMetadata(requestHash)).attester).to.equal(attester);
        });

        describe("zkID(addrss,bytes32)", function () {
            beforeEach(async function () {
                await addProof(proof, user1, proofInfo);
                await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);
            });

            it('set superior', async function () {
                await rac.superAuth(project.address, true);
                let [isPassed, calcOutput] = await rac.connect(project).zkID(user1.address, requestHash);
                expect(isPassed).to.equal(true);
                expect(calcOutput[0]).to.equal(expectResult[0]);
            });

            it('perVisitFee != 0', async function () {
                await rac.applyRequest(requestHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));
                let [isPassed, calcOutput] = await rac.connect(project).zkID(user1.address, requestHash);
                expect(isPassed).to.equal(true);
                expect(calcOutput[0]).to.equal(expectResult[0]);
            });
            // TODO: when address(this) call zkID?
        });

        describe('onTransferReceived(address,address,uint256,bytes)', function () {
            it('zkID result is false', async function () {
                await rac.applyRequest(requestHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));

                await expect(MTK['transferAndCall(address,uint256,bytes)'](
                    rac.address,
                    ethers.utils.parseEther('10.0'),
                    data
                )).to.be.revertedWith("ERC1363: _checkAndCallTransfer reverts");
                // console log check zkID 'res' is false
            });

        });
    });
});