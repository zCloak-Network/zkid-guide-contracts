///
/// @author vsszhang
/// @dev In this script, I will show you how to mint and cliam the poap nft
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

const { 
    cType,
    fieldName,
    programHash,
    attesterAccount,
} = require("./variable.js");

const {
    addrRAC,
    addrFactory
} = require("../tmp/contract.json");

const uri = "test";

async function main() {
    // generate workers contract instance
    const owner = await ethers.getSigner(0);
    const user1 = await ethers.getSigner(1);

    console.log(`user1: ${user1.address}`);

    const RAC = await ethers.getContractFactory("ReadAccessController", owner);
    const rac = RAC.attach(addrRAC);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldNames: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });

    const Factory = await ethers.getContractFactory('PoapFactory', owner);
    const factory = Factory.attach(addrFactory);

    // owner mint a nft
    console.log(`Mint new NFT...`);
    let txNewPoap = await factory.newPoap(rHash, uri);
    await txNewPoap.wait();

    // attach new nft
    console.log(`Attach new NFT...`);
    const ZcloakPoap = await ethers.getContractFactory('ZCloakPoap', owner);
    const poap = ZcloakPoap.attach(await factory.connect(user1).rh2poaps(rHash));
    console.log(`nft address: ${await factory.connect(user1).rh2poaps(rHash)}`);

    // owner set super auth to poap contract
    console.log(`Set super auth(optional)...`);
    let txAuth = await rac.superAuth(poap.address, true);
    await txAuth.wait();

    // user1 claim an nft
    console.log(`User1 claim NFT...`);
    let txNFTclaim = await poap.connect(user1).claim();
    await txNFTclaim.wait();

    console.log(`SUCCESS: nft claim`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });