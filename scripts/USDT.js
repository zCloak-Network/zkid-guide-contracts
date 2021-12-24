///
/// @author vsszhang
/// @dev Creating USDT sample token.
///
const { ethers } = require("hardhat");

const { owenrWallet } = require("./variable.js");

async function main() {
    const Token = await ethers.getContractFactory("SampleToken", owenrWallet);

    // deploy the contract file SampleToken.sol
    const token = await Token.deploy("USDT", "USDT");
    await token.deployed();
    console.log("USDT token is deployed at: ", token.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });