//
// @author vsszhang
// @dev mint 100 custom sample tokens.
// @notice The token number is fixed in contract and its decimal
// is 10**18 Wei.
//
const fs = require('fs');
const { ethers } = require("hardhat");

async function main() {
    const project = await ethers.getSigner(3);
    const Token = await ethers.getContractFactory("MockERC1363", project);

    // deploy the contract file SampleToken.sol
    const token = await Token.deploy("MyToken", "MTK");
    await token.deployed();
    console.log("SUCCESS: mint token");
    console.log("Token address: ", token.address);

    const obj = {
        addrToken: token.address
    }
    const content = JSON.stringify(obj, null, 4);
    fs.writeFileSync('./token.json', content);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });