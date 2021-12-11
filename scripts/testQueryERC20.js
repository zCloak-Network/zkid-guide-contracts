const { ethers } = require("hardhat");
const { deployer, provider, bytes32UINT_APPROVE_THRESHOLD } = require("./variable.js");

const abiSampleToken = require("../artifacts/contracts/SampleToken.sol/SampleToken.json");



async function main() {
    const stAddress = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";

    var tokenInst = await ethers.getContractAt("SampleToken", stAddress);
    await tokenInst.balanceOf('0x5BF631060b226407A1353bcEef88e3f98aB722A8').then(function (bal) {
        console.log(bal);
     })
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });