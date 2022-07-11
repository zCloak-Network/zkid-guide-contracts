//
// @dev keeper use this script to exchange individualReputation
// points for tokens
//
const { ethers } = require("hardhat");

const { addrToken } = require("./token.json");
const { addrRAC, addrReputation, addrAddressesUtils } = require("./contract.json");
const { cType, fieldName, programHash, attesterAccount } = require("./variable.js");

async function main() {
    const owner = await ethers.getSigner(0);
    const keeper1 = await ethers.getSigner(6);
    const keeper2 = await ethers.getSigner(7);
    const keeper3 = await ethers.getSigner(8);

    const RAC = await ethers.getContractFactory('ReadAccessController', owner);
    const rac = RAC.attach(addrRAC);

    const Token = await ethers.getContractFactory('MockERC1363', owner);
    const MTK = Token.attach(addrToken);

    const Reputation = await ethers.getContractFactory(
        'Reputation',
        {
            libraries: {
                AddressesUtils: addrAddressesUtils
            }
        },
        owner
    );
    const reputation = Reputation.attach(addrReputation);

    let rHash = await rac.getRequestHash({
        cType: cType,
        fieldName: fieldName,
        programHash: programHash,
        attester: attesterAccount
    });

    // let txClaim1 = await reputation.connect(keeper1).claimToken(rHash, addrToken);
    // await txClaim1.wait();
    console.log(`keeper1 MTKs: ${await MTK.balanceOf(keeper1.address)}`);

    // let txClaim2 = await reputation.connect(keeper2).claimToken(rHash, addrToken);
    // await txClaim2.wait();
    console.log(`keeper2 MTKs: ${await MTK.balanceOf(keeper2.address)}`);

    // let txClaim3 = await reputation.connect(keeper3).claimToken(rHash, addrToken);
    // await txClaim3.wait();
    console.log(`keeper3 MTKs: ${await MTK.balanceOf(keeper3.address)}`);

    console.log(`SUCCESS: claim token`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });