///
/// @author vsszhang
/// @dev 'user1' and 'user2' is user, 'Moonbase Alpha 1' is deployer
///
const { ethers } = require("hardhat");
const { cType, programHash } = require("./variable");

async function main() {
    const addressRegulatedTransfer = "0x7318F50474bc7b08A6a35fDf44e2E00Cb0b2FD6a";
    const addressERC20 = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
    const user2 = "0x07b1A69FBaf43199b4720353ae60B239931C55E0";
    const amount = 100;
    const addressRegistry = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
    const addressProperties = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";

    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer");
    const regulatedTransfer = await RegulatedTransfer.attach(addressRegulatedTransfer);
    
    const Registry = await ethers.getContractFactory("Registry");
    const registry = await Registry.attach(addressRegistry);

    const Properties = await ethers.getContractFactory("Properties");
    const properties = await Properties.attach(addressProperties);

    /// @dev suppose sending token to user2
    const checker = registry.addressOf(properties.CONTRACT_ACCESS);
    // console.log("checker: ", checker);
    regulatedTransfer.rTransfer(checker, addressERC20, user2, amount, cType, programHash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });