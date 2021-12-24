///
/// @author vsszhang
/// @dev Creating USDC sample token.
///
const { ethers } = require("hardhat");

const { owenrWallet } = require("./variable.js");

async function main() {
    const Token = await ethers.getContractFactory("SampleToken", owenrWallet);

    // deploy the contract file SampleToken.sol
    const token = await Token.deploy("USDC", "USDC");
    await token.deployed();
    console.log("USDC token is deployed at: ", token.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });