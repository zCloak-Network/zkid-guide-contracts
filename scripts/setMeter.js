const { ethers } = require("hardhat");

const { addrRAC } = require("./contract.json");
const { addrToken } = require("./token.json");
const { attesterAccount, cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");

async function main() {
    const owner = await ethers.getSigner(0);
    const project = await ethers.getSigner(3);
    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    let rDetail = {
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    };
    console.log(rDetail);
    let rHash = await rac.getRequestHash(rDetail);
    console.log(rHash);
    let tx = await rac.applyRequest(
        rHash,
        project.address,
        addrToken,
        ethers.utils.parseEther('2.0')
    );
    await tx.wait();
    console.log('SUCCESS: set meter');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });