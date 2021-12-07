///
/// @author vsszhang
/// @dev 'user1' is user, 'Moonbase Alpha 1' is deployer
///
const { ethers } = require("hardhat");
const { kiltAddress,
        cType,
        fieldName,
        programHash,
        proofCid,
        rootHash,
        expectResult } = require("./variable");

async function main() {
    const addressKiltProofsV1 = "0x3b790fB0C5A8CA515308F2edaf6b676f937B02b0";
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
    const kiltProofsV1 = await KiltProofsV1.attach(addressKiltProofsV1);

    console.log("KiltProofsV1 address: ", kiltProofsV1.address);
    kiltProofsV1.addProof(kiltAddress, cType, fieldName, programHash, proofCid, rootHash, expectResult);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });