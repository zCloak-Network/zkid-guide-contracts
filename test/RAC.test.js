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
    let user;
    let keeper1;
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let project;

    // variable
    let rHash;
    let data;

    beforeEach(async function () {
        [owner, user, keeper1, project] = await ethers.getSigners();
        let keepers = [keeper1.address];

        const Registry = await ethers.getContractFactory('Registry', owner);
        const Properties = await ethers.getContractFactory('Properties', owner);
        const AddressesUtils = await ethers.getContractFactory('AddressesUtils', owner);
        const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", owner);
        const ProofStorage = await ethers.getContractFactory("ProofStorage", owner);
        const RAC = await ethers.getContractFactory('MockRAC', owner);
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
        MTK = new ethers.Contract(mockMTKA.address, abi, project);

        // library linking contract
        const MockReputation = await ethers.getContractFactory(
            'MockReputation',
            { libraries: { AddressesUtils: addressesUtils.address } },
            owner
        );
        mockReputation = await MockReputation.deploy(registry.address);
        await mockReputation.deployed();

        const MockSAggregator = await ethers.getContractFactory(
            "MockSimpleAggregator",
            {
                libraries: {
                    AddressesUtils: addressesUtils.address,
                    Bytes32sUtils: bytes32sUtils.address,
                },
            },
            owner
        );
        mockSAggregator = await MockSAggregator.deploy(registry.address);
        await mockSAggregator.deployed();

        // AuthControl setting
        await rac.setAuthority(racAuth.address);
        await mockSAggregator.setAuthority(sAggregatorAuth.address);
        await mockReputation.setAuthority(reputationAuth.address);

        // Registry setting
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        // get requestHash
        rHash = await rac.getRequestHash({ cType: cType, fieldNames: fieldName, programHash: programHash, attester: attester });
        data = ethers.utils.hexZeroPad(user.address, 32) + rHash.replace('0x', '');
    });

    describe("API functional test", function () {
        it('applyRequest(bytes32,address,address,uint256)', async function () {
            await rac.applyRequest(rHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));
            expect((await rac.applied(rHash, project.address)).token).to.equal(MTK.address);
            expect((await rac.applied(rHash, project.address)).perVisitFee).to.equal(ethers.utils.parseEther('2.0'));
        });

        it('exists(bytes32)', async function () {
            expect(await rac.exists(rHash)).to.equal(false);
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
            expect((await rac.requestInfo(rHash)).cType).to.equal(cType);
            expect(await rac.exists(rHash)).to.equal(true);
        });

        it('requestMetadata(bytes32)', async function () {
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
            expect((await rac.requestMetadata(rHash)).cType).to.equal(cType);
            expect((await rac.getFieldName(rHash))[0]).to.equal(fieldName[0]);
            expect((await rac.requestMetadata(rHash)).programHash).to.equal(programHash);
            expect((await rac.requestMetadata(rHash)).attester).to.equal(attester);
        });

        describe("zkID(addrss,bytes32)", function () {
            it('set superior', async function () {
                await rac.superAuth(project.address, true);

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
                await mockSAggregator.submit(
                    user.address,
                    rHash,
                    cType,
                    rootHash,
                    true,
                    attester,
                    expectResult
                );
                let [isPassed, calcOutput] = await rac.connect(project).zkID(user.address, rHash);
                expect(isPassed).to.equal(true);
                expect(calcOutput[0]).to.equal(expectResult[0]);
            });

            it('perVisitFee != 0', async function () {
                await rac.applyRequest(rHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));

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
                await mockSAggregator.submit(
                    user.address,
                    rHash,
                    cType,
                    rootHash,
                    true,
                    attester,
                    expectResult
                );
                let [isPassed, calcOutput] = await rac.connect(project).zkID(user.address, rHash);
                expect(isPassed).to.equal(true);
                expect(calcOutput[0]).to.equal(expectResult[0]);
            });
            // TODO: when address(this) call zkID?
        });

        describe('onTransferReceived(address,address,uint256,bytes)', function () {
            it('zkID result is false', async function () {
                await rac.applyRequest(rHash, project.address, MTK.address, ethers.utils.parseEther('2.0'));

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