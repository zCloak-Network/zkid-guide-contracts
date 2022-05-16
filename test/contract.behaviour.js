const { ethers } = require("hardhat");

submit = async function (mockSAggregator, keeperArr, user, requestHash, isPassedArr, submitInfo) {
    let tx = [];
    for (let i = 0; i < keeperArr.length; i++) {
        let txSubmit = await mockSAggregator.connect(keeperArr[i]).submit(
            user.address,
            requestHash,
            submitInfo.cType,
            submitInfo.rootHash,
            isPassedArr[i],
            submitInfo.attester,
            submitInfo.expectResult
        );
        tx.push(txSubmit);
    }
    return tx;
}

addProof = async function (proof, user, proofInfo) {
    let tx = await proof.connect(user).addProof(
        proofInfo.kiltAccount,
        proofInfo.attester,
        proofInfo.cType,
        proofInfo.fieldName,
        proofInfo.programHash,
        proofInfo.proofCid,
        proofInfo.rootHash,
        proofInfo.expectResult
    );
    return tx;
}

authControl = async function (rac, racAuth, mockSAggregator, sAggregatorAuth, mockReputation, reputationAuth) {
    await rac.setAuthority(racAuth.address);
    await mockSAggregator.setAuthority(sAggregatorAuth.address);
    await mockReputation.setAuthority(reputationAuth.address);
}

deployMockRepution = async function (deployer, mockReputation, addressesUtils, registry) {
    const MockReputation = await ethers.getContractFactory(
        'MockReputation',
        {
            libraries: {
                AddressesUtils: addressesUtils.address
            }
        },
        deployer
    );
    mockReputation = await MockReputation.deploy(registry.address);
    await mockReputation.deployed();

    return mockReputation;
}

deployMockSAggregator = async function (deployer, mockSAggregator, addressesUtils, bytes32sUtils, registry) {
    const MockSAggregator = await ethers.getContractFactory(
        "MockSimpleAggregator",
        {
            libraries: {
                AddressesUtils: addressesUtils.address,
                Bytes32sUtils: bytes32sUtils.address,
            },
        },
        deployer
    );
    mockSAggregator = await MockSAggregator.deploy(registry.address);
    await mockSAggregator.deployed();

    return mockSAggregator;
}

deployCommon = async function (deployer, keepers, registry, property, addressesUtils, bytes32sUtils, proof, rac, racAuth, reputationAuth, sAggregatorAuth) {
    const Registry = await ethers.getContractFactory('Registry', deployer);
    const Properties = await ethers.getContractFactory('Properties', deployer);
    const AddressesUtils = await ethers.getContractFactory('AddressesUtils', deployer);
    const Bytes32sUtils = await ethers.getContractFactory("Bytes32sUtils", deployer);
    const ProofStorage = await ethers.getContractFactory("ProofStorage", deployer);
    const RAC = await ethers.getContractFactory('MockRAC', deployer);
    const RACAuth = await ethers.getContractFactory("RACAuth", deployer);
    const ReputationAuth = await ethers.getContractFactory("ReputationAuth", deployer);
    const SimpleAggregatorAuth = await ethers.getContractFactory("SimpleAggregatorAuth", deployer);

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

    return { registry, property, addressesUtils, bytes32sUtils, proof, rac, racAuth, reputationAuth, sAggregatorAuth };

}

module.exports = {
    submit,
    addProof,
    authControl,
    deployCommon,
    deployMockRepution,
    deployMockSAggregator
}