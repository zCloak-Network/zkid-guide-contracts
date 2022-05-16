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
    attester,
    proofInfo,
    submitInfo
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
    let user1;
    let keeper1;
    let keeper2;
    let project;

    // variable
    let requestHash;
    let tokens
    let txAdd;

    let sourceFile;
    let source;
    let abi;

    beforeEach(async function () {

        [ owner, user1, keeper1, keeper2, project ] = await ethers.getSigners();
        let keepers = [ keeper1.address, keeper2.address ];
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
        await registry.setUint32Property(property.UINT32_THRESHOLD(), 1);
        await registry.setAddressProperty(property.CONTRACT_REQUEST(), rac.address);
        await registry.setAddressProperty(property.CONTRACT_MAIN_KILT(), proof.address);
        await registry.setAddressProperty(property.CONTRACT_REPUTATION(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_AGGREGATOR(), mockSAggregator.address);
        await registry.setAddressProperty(property.CONTRACT_REWARD(), mockReputation.address);
        await registry.setAddressProperty(property.CONTRACT_READ_GATEWAY(), rac.address);

        requestHash = await rac.getRequestHash({
            cType: cType,
            fieldNames: fieldName,
            programHash: programHash,
            attester: attester
        });

        // set meter
        await rac.connect(owner).applyRequest(
            requestHash,
            project.address,
            MTKA.address,
            ethers.utils.parseEther('2.0')
        );

        // user1 add proof first
        await addProof(proof, user1, proofInfo);

        // keeper add token in payments
        tokens = [MTKA.address, MTKB.address];
        txAdd = await mockReputation.connect(keeper1).batchAdd(requestHash, tokens);

        // keeper submit verification result
        await submit(mockSAggregator, [keeper1], user1, requestHash, [true], submitInfo);

        const data = ethers.utils.hexZeroPad(user1.address, 32) + requestHash.replace('0x', '');
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

});