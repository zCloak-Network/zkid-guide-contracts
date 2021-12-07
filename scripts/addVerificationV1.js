///
/// @author vsszhang
/// @dev 'user1' is user, 'Moonbase Alpha 1' is deployer
///
const { ethers } = require("hardhat");
const { rootHash, cType, programHash, isPassed } = require("./userAddProof");

async function main() {
    const dataOwner = "0x6B4e14C40457956b7cB80f2391124951ad444e31";
    const addressKiltProofsV1 = "0x3b790fB0C5A8CA515308F2edaf6b676f937B02b0";

    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1");
    const kiltProofsV1 = await KiltProofsV1.attach(addressKiltProofsV1);

    kiltProofsV1.addVerification(dataOwner, rootHash, cType, programHash, isPassed);
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });