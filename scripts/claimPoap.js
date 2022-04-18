const { ethers } = require("hardhat");

const {addrPoap, addrRAC } = require("./contract.json");
const { poapId } = require("./variable.js");

async function main() {
    console.log("start claiming poap...")
    const proofAdder = await ethers.getSigner(1);
    const owner = await ethers.getSigner(0);

    const Poap = await ethers.getContractFactory('ZCloakPoap', proofAdder);
    const poap = Poap.attach(addrPoap);


    // new poap
    await poap.claim();
    console.log("claim over");

    // check balance
    let balance = await poap.totalBalanceOf(poapId, proofAdder.address);
    console.log("balance of proofadder is ", balance);


    console.log(`SUCCESS: claim a poap`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });