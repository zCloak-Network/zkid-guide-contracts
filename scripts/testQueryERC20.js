const { ethers } = require("hardhat");
const { deployer, provider, bytes32UINT_APPROVE_THRESHOLD } = require("./variable.js");

const abiSampleToken = require("../artifacts/contracts/SampleToken.sol/SampleToken.json");



async function main() {
    const stAddress = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
    const registryAddress = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
    const whitelsitAdd = "0x4Cc6Ce9360d2249ad13Fe300D6Ac85B9CD3a538b";
    const kiltAdd = "0x72AcB0f573287B3eE0375964D220158cD18465cb";
    const propertyAdd = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";
    const rTransferAdd = "0xC8e2409A0E15CBe517E178972855D486e7E881e1";
    const ctype = "0x7f2ef721b292b9b7d678e9f82ab010e139600558df805bbc61a0041e60b61a18";
    const programHash = "0x8acf8f36dbd0407ced227c97f9f1bcf989c6affd32231ad56a36e9dfcd492610";
    const worker2 = "0x5C88cC2C1DC4fCd746C2D41b95Eb036FaDF05Fb2";

    var tokenInst = await ethers.getContractAt("SampleToken", stAddress);
    await tokenInst.balanceOf('0x5BF631060b226407A1353bcEef88e3f98aB722A8').then(function (bal) {
        console.log(bal);
     })

     // get regitry
     var registry = await ethers.getContractAt("Registry", registryAddress);
     var property = await ethers.getContractAt("Properties", propertyAdd);


     let kiltproperty = await property.CONTRACT_MAIN_KILT();
     console.log("kilt properties is: ", kiltproperty);

     let whilteproperty = await property.CONTRACT_WHITELIST();
     console.log("whitelist properties is: ", whilteproperty);

     let thresholdPro = await property.UINT_APPROVE_THRESHOLD();
     console.log("thresold properties is: ", thresholdPro);

     
     let kiltInReg =  await registry.addressOf(kiltproperty);
     console.log("kilt address in registry is : ", kiltInReg);

     let whiteInReg =  await registry.addressOf(whilteproperty);
     console.log("whitelist address in registry is : ", whiteInReg);
     
     let thresoldInREg =  await registry.uintOf(thresholdPro);
     console.log("threshold in registry is : ", thresoldInREg);


     var whitelist = await ethers.getContractAt("Whitelist", whiteInReg);
     var kilt = await ethers.getContractAt("KiltProofsV1", kiltAdd);


     let worker = "0x8607514B15762E53612bCB3A3e4f1aDA226170c1";
     let isWorker = await whitelist.isWorker(worker);
     console.log("is worker: ", isWorker);

     let  registryInKilt = await kilt.registry();
     console.log("registry in kilt is: ", registryInKilt);

     let rolepro = await kilt.REGULATED_ERC20();
     let res = await kilt.hasRole(rolepro, rTransferAdd);
     console.log("has kilt grant role to rtransfer:", res);

     
     let programhash = await kilt.trustedPrograms("0x7318F50474bc7b08A6a35fDf44e2E00Cb0b2FD6a", "0x7f2ef721b292b9b7d678e9f82ab010e139600558df805bbc61a0041e60b61a18");
     console.log("praogram hash is :{}", programhash);

     let isPassed = await kilt.isPassed(worker2, programhash, ctype);
     let isValid = await kilt.isValid(worker2, ctype);
     console.log("is valid", isValid);
     console.log("is passed: ", isPassed);

   


    //  var registry = await ethers.getContractAt("Registry", )
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });