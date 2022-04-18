///
/// @author vsszhang
/// @dev This script only send addProof tx. User can add his/her proof.
/// Every user can only add proof once
/// @notice test network: Moonbase Alpha
///
const { BigNumber } = require("ethers");
const BN = require("bn.js");
const { ethers } = require("hardhat");


let newAttester = ethers.utils.formatBytes32String('newAttester');
let kiltAccount = ethers.utils.formatBytes32String("kiltAccount");
let kiltAccountOther = ethers.utils.formatBytes32String("kiltAccountOther");

const { addrRAC } = require("./contract.json");

const { attesterAccount, cType, fieldName, programHash, proofCid, rootHash, expectResult, proofStorageAddr } = require("./variable.js");


async function main() {

    const lixin = "0x7b627b7991d7364b332e8b48a99178cde5e3be2c";
    const lixinRH = "0xa47cdbafddcbde5c9f532b3ac52e6e89ba9d98d51517b6875165b76d0e38796f";
    const owner = await ethers.getSigner(0);
    const user1 = await ethers.getSigner(1);
       /// remember to give poap the access to rac
       const RAC = await ethers.getContractFactory('ReadAccessController', owner);
       const rac = RAC.attach(addrRAC);
       await rac.superAuth(owner, true);
    // user add proof
    let (isValid, output) = await rac.zkID(lixin, lixinRH);
    console.log("isValid", isValid);
}
    main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });