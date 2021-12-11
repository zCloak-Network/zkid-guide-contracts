const { ethers } = require("hardhat");
const {
    bytes32CType,
    bytes32ProgramHash,
    bytes32rootHash,
    bytes32kiltAddress,
    bytes32CONTRACT_MAIN_KILT,
    bytes32REGULATED_ERC20,
    kiltAddress,
    expectResult,
    fieldName,
    proofCid,
    amount,
    addressERC20,
    addressRegistry,
    addressProperties,
    addressKiltProofsV1,
    addressRegulatedTransfer,
    provider,
    user1,
    user2,
    deployer } = require("./variable");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");
const abiRegistry = require("../artifacts/contracts/Registry.sol/Registry.json");
const abiProperties = require("../artifacts/contracts/Properties.sol/Properties.json");

async function main() {
    const deployerAccount_from = {
        privateKey: '0bc365e0e28a4134f0ce5568f562e0adeeefda7edc636d443cdab3ed8a4e92fd',
    };
    let deployerWallet = await new ethers.Wallet(deployerAccount_from.privateKey, provider);
    
    const user1Account_from = {
        privateKey: '1f2c36eed30b62e92c6bbb8fc3c3f02b2be01acdc6e3cb797dbfebf231fcc337',
    };
    let user1Wallet = await new ethers.Wallet(user1Account_from.privateKey, provider);

    const user1KiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, user1Wallet);
    const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerWallet);
    const deployerKiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, deployerWallet);

    // console.log("00");
    await deployerKiltProofsV1.grantRole(ethers.utils.formatBytes32String("REGULATED_ERC20"), addressRegulatedTransfer);
    // console.log("000");

    await deployerRegulatedTransfer.addRule(addressERC20, addressKiltProofsV1, bytes32CType, bytes32ProgramHash, expectResult);
    // console.log("111");

    await user1KiltProofsV1.addProof(bytes32kiltAddress, bytes32CType, fieldName, bytes32ProgramHash, proofCid, bytes32rootHash, expectResult);
    // console.log("222");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });