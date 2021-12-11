///
/// @author vsszhang
/// @dev In this script, we will define 2 users, 2 workers and one deployer.
/// These accounts where in the MetaMask are named at user1, user2, worker1,
/// worker2 and deployer. Otherwise, I will use the smart contract that has been
/// deployed at Moonbase Alpha testnet.
///
const { ethers } = require("hardhat");
const {
    bytes32CType,
    bytes32ProgramHash,
    bytes32rootHash,
    bytes32CONTRACT_MAIN_KILT,
    bytes32REGULATED_ERC20,
    expectResult,
    amount,
    addressERC20,
    addressRegistry,
    addressProperties,
    addressKiltProofsV1,
    addressRegulatedTransfer,
    provider,
    user1,
    user2,
    deployer,} = require("./variable");
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

    // const user1Signer = await provider.getSigner(user1);
    // const deployerSigner = await provider.getSigner(deployer);

    // const deployerKiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, deployerSigner);
    // console.log("-1-1");

    // const user1RegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, user1Signer);
    // const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerSigner);
    // console.log("00");
    // // const deployerRegistry = await new ethers.Contract(addressRegistry, abiRegistry.abi, deployerSigner);
    // const Registry = await ethers.getContractFactory("Registry");
    // const deployerRegistry = await Registry.attach(addressRegistry);
    // console.log("11");
    // const user1Properties = await new ethers.Contract(addressProperties, abiProperties.abi, user1Signer);
    // console.log("22");

    const deployerRegistry = await new ethers.Contract(addressRegistry, abiRegistry.abi, deployerWallet);
    const deployerKiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, deployerWallet);
    const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerWallet);
    const user1RegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, user1Wallet);
    

    /// Grants 'REGULATED_ERC20' role to contract RegulatedTransfer
    // try {
    //     await deployerKiltProofsV1.grantRole(ethers.utils.formatBytes32String("REGULATED_ERC20"), addressRegulatedTransfer);
    // } catch (error) {
    //     console.log(error);
    // }
    
    /// add KiltProofsV1 in our registry
    await deployerRegistry.setAddressProperty(ethers.utils.formatBytes32String("CONTRACT_MAIN_KILT"), addressKiltProofsV1);
    console.log("000");

    await deployerKiltProofsV1.grantRole(ethers.utils.formatBytes32String("REGULATED_ERC20"), addressRegulatedTransfer);
    console.log("111");

    await deployerRegulatedTransfer.addRule(addressERC20, addressKiltProofsV1, bytes32CType, bytes32ProgramHash, expectResult);
    console.log("222");
    
    // /// add third part rule, set its 'program' as 'trustedProgram'
    // /// @dev when third part want to call isValid() and isPassed(), it should pass the 'isRegistry' modifier
    // await deployerRegulatedTransfer.addRule(addressERC20, checker, bytes32CType, bytes32ProgramHash, expectResult);
    
    /// @dev suppose sending token to user2
    await user1RegulatedTransfer.rTransfer(addressKiltProofsV1, addressERC20, user2, amount, bytes32CType, bytes32ProgramHash);
    console.log("333");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });