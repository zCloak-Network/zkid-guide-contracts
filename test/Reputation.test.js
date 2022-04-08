const fs = require("fs");
const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

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

describe('Reputation Contract', function () {

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
    let attester = ethers.utils.formatBytes32String("attester");
    let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
    let project;

    // variable
    let requestHash;
    let tokens
    let txAdd;

    let sourceFile;
    let source;
    let abi;

    beforeEach(async function () {

        [ owner, user, keeper1, keeper2, project ] = await ethers.getSigners();
        let keepers = [ keeper1.address, keeper2.address ];
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
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

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

        // keeper add token in payments
        tokens = [MTKA.address, MTKB.address];
        requestHash = await rac.getRequestHash(
            cType,
            fieldName,
            programHash,
            expectResult,
            attester
        );
        txAdd = await mockReputation.connect(keeper1).batchAdd(requestHash, tokens);

        // keeper submit verification result
        await mockSAggregator.connect(keeper1).submit(
            user.address,
            requestHash,
            cType,
            rootHash,
            isPassed_t,
            attester
        );

        // set meter
        await rac.connect(owner).applyRequest(
            requestHash,
            project.address,
            MTKA.address,
            ethers.utils.parseEther('2.0')
        );

        const data = ethers.utils.hexZeroPad(user.address, 32) + requestHash.replace('0x', '');
        // project recharge 10 MTKAs to reward pool
        await MTKA.connect(project)['transferAndCall(address,uint256,bytes)'](
            rac.address,
            ethers.utils.parseEther('10.0'),
            data
        );
    });

    describe("check value:", function () {
        it("Should emit 'Add' event if add token successfully", async function () {
            expect(await mockReputation.getToken(requestHash, 0)).to.equal(MTKA.address);
            expect(await mockReputation.getToken(requestHash, 1)).to.equal(MTKB.address);
            expect(txAdd).to.emit(mockReputation, 'Add').withArgs(tokens[0], keeper1.address);
            expect(txAdd).to.emit(mockReputation, 'Add').withArgs(tokens[1], keeper1.address);
        });
        
        it("Should have 10 MTKAs if rewardPool sucessfully received tokens", async function () {
            expect(await MTKA.balanceOf(mockReputation.address))
                .to.equal(ethers.utils.parseEther('10.0'));
            expect(await mockReputation.getTotalReward(requestHash, MTKA.address))
                .to.equal(ethers.utils.parseEther('10.0'));
        });
    });

    describe("keeper claim token", function () {
        it("Should success if keeper can claim token", async function () {
            let tx = await mockReputation.connect(keeper1).claimToken(requestHash, MTKA.address);
            expect(tx).to.emit(mockReputation, 'Claim')
                .withArgs(MTKA.address, ethers.utils.parseEther('10.0'), keeper1.address);
            // keeper should receive reputation
            expect(await MTKA.balanceOf(keeper1.address)).to.equal(ethers.utils.parseEther('10.0'));
        });
    });

    // TODO: add other things:)?
});