///
/// @author vsszhang
/// @dev Creating USDC sample token and calling addRule.
///
const { ethers } = require("hardhat");

const { deployerWallet } = require("./variable.js");
const { addressKiltProofsV1, addressRegulatedTransfer } = require("./variable.js");
const { bytes32CType, bytes32ProgramHash, expectResult } = require("./variable.js");
const abiKiltProofsV1 = require("../artifacts/contracts/KiltProofsV1.sol/KiltProofsV1.json");
const abiRegulatedTransfer = require("../artifacts/contracts/RegulatedTransferV1.sol/RegulatedTransfer.json");

async function main() {
    const SampleToken = await ethers.getContractFactory("SampleToken");

    /// deploy the contract file SampleToken.sol
    const sampleToken = await SampleToken.deploy("USDC", "USDC");
    await sampleToken.deployed();
    console.log("USDT is deployed at: ", sampleToken.address);

    /// create contract instance
    const deployerKiltProofsV1 = await new ethers.Contract(addressKiltProofsV1, abiKiltProofsV1.abi, deployerWallet);
    const deployerRegulatedTransfer = await new ethers.Contract(addressRegulatedTransfer, abiRegulatedTransfer.abi, deployerWallet);

    /// grant 'REGULATED_ERC20' role to RegulatedTransfer.sol
    await deployerKiltProofsV1.grantRole(ethers.utils.formatBytes32String("REGULATED_ERC20"), addressRegulatedTransfer);
    console.log("Successfully grant 'REGULATED_ERC20' role to RegulatedTransfer.sol");

    /// add a new rule for third part, let program become trusted program
    await deployerRegulatedTransfer.addRule(sampleToken.address, addressKiltProofsV1, bytes32CType, bytes32ProgramHash, expectResult);
    console.log("Successfully call addRule.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });