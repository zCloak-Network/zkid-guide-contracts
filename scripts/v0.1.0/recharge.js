//
// @dev Project use this script recharge token t0 reward pool
//
const fs = require("fs");
const { ethers } = require("hardhat");

const { addrRAC } = require("./contract.json");
const { addrToken } = require("./token.json");
const { attesterAccount, cType, fieldName, programHash, proofCid, rootHash, expectResult } = require("./variable.js");

var sourceFile = fs.readFileSync('../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json');
var source = JSON.parse(sourceFile);
var abi = source.abi;

async function main() {
    // create contract intance
    const user1 = await ethers.getSigner(1);
    const project = await ethers.getSigner(3);

    const RAC = await ethers.getContractFactory('ReadAccessController', project);
    const rac = RAC.attach(addrRAC);
    // const Token = await ethers.getContractFactory('MockERC1363', project);
    // const token = Token.attach(addrToken);
    const MTK = new ethers.Contract(addrToken, abi, project);

    // set variable
    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });
    let data = ethers.utils.hexZeroPad(user1.address, 32) + rHash.replace('0x', '');

    console.log('1');
    // project recharge 10 MTKs to reward pool
    let tx = await MTK['transferAndCall(address,uint256,bytes)'](
        rac.address,
        ethers.utils.parseEther('10.0'),
        data
    );
    await tx.wait();
    console.log(`Token transfer tx: ${tx}`);
    console.log('SUCCESS: recharge token');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });