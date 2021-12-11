const { ethers } = require("hardhat");

/// data
let fieldName = "616765";
let cType = "0x5ff696698bdbb6415d30e328c2a030b3ddd0c1d2dee8c4d58da4d7ef5a34adc1";
let programHash = "0xdb70dbc46d57bb7ecb3aa2ceb657592b2c1ab6b427fe1dcd7532d1dcacd24998";
let proofCid = "QmNRe7jAHu2MXad4f6jDePPCRrpnaRSLGG2fEtHZUoekpD";
let rootHash = "0xbdf1fd3c489dbf96aa6c7507d3a56957ea1cd5f0bddd1b0222e0a90032d7b0e1";
let kiltAddress = "4tXisxG6wr9bm2ZRxVLyZkzfzq17HTq4PYzL3WXy9HmEzs67";
let expectResult = true;
let isPassed = true;
let amount = 1;

/// role
let REGULATED_ERC20 = "REGULATED_ERC20";

/// account address in vsszhang's MetaMask
const user1 = "0x6B4e14C40457956b7cB80f2391124951ad444e31";
const user2 = "0x07b1A69FBaf43199b4720353ae60B239931C55E0";
const worker1 = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac";
const worker2 = "0x5C88cC2C1DC4fCd746C2D41b95Eb036FaDF05Fb2";
const worker3 = "0x59B6D4733176346616564E8ACd781a8169B35a6D";
const worker4 = "0x34Ef2480E87A50EBad888653D6B06b1bD7430064";
const worker5 = "0x36F352162c97cB5C6d009468eC926014A0B189d8";
const deployer = "0x6f56C250992655f9ca83E3246dcBDC9555A6771F";

/// contract address on Moonbase Alpha
const addressRegistry = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
const addressProperties = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";
const addressWhitelist = "0x4Cc6Ce9360d2249ad13Fe300D6Ac85B9CD3a538b";
const addressKiltProofsV1 = "0x3b790fB0C5A8CA515308F2edaf6b676f937B02b0";
// const addressKiltProofsV1 = "0x8cD135561C1143e5547413aefe202D221CdD82a0";
const addressSampleToken = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
const addressRegulatedTransfer = "0x7318F50474bc7b08A6a35fDf44e2E00Cb0b2FD6a";
const addressERC20 = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";

/// properties
let CONTRACT_MAIN_KILT = "CONTRACT_MAIN_KILT";
let UINT_APPROVE_THRESHOLD = "UINT_APPROVE_THRESHOLD";

/// the provider of Moonbase Alpha testnet
const providerRPC = {
    moonbase: {
        name: 'moonbase-alpha',
        rpc: 'https://rpc.testnet.moonbeam.network',
        chainId: 1287,
    },
};
const provider = new ethers.providers.StaticJsonRpcProvider(
    providerRPC.moonbase.rpc,
    {
        chainId: providerRPC.moonbase.chainId,
        name: providerRPC.moonbase.name,
    }
);

/// data type transfer: string => bytes32
var stringCType = new String(cType);
var bytes32CType = stringCType.valueOf();

var stringProgramHash = new String(programHash);
var bytes32ProgramHash = stringProgramHash.valueOf();

var stringRootHash = new String(rootHash);
var bytes32rootHash = stringRootHash.valueOf();

// var stringKiltAddress = new String(kiltAddress);
// var bytes32kiltAddress = stringKiltAddress.valueOf();
let bytes32kiltAddress = "0xf85edd58bd7de60dac41894c508a1522f86d4b1066e3a4cbea3ab0353e659d55";

/// role type transfer: string => bytes32
var stringREGULATED_ERC20 = new String(REGULATED_ERC20);
var bytes32REGULATED_ERC20 = stringREGULATED_ERC20.valueOf();

/// properties type transfer: string => bytes32
var stringCONTRACT_MAIN_KILT = new String(CONTRACT_MAIN_KILT);
var bytes32CONTRACT_MAIN_KILT = stringCONTRACT_MAIN_KILT.valueOf();

var stringUINT_APPROVE_THRESHOLD = new String(UINT_APPROVE_THRESHOLD);
var bytes32UINT_APPROVE_THRESHOLD = stringUINT_APPROVE_THRESHOLD.valueOf();

module.exports = {
    /// data
    fieldName: fieldName,
    cType: cType,
    programHash: programHash,
    proofCid: proofCid,
    rootHash: rootHash,
    kiltAddress: kiltAddress,
    expectResult: expectResult,
    isPassed: isPassed,
    amount: amount,

    /// bytes32 data
    bytes32CType: bytes32CType,
    bytes32ProgramHash: bytes32ProgramHash,
    bytes32rootHash: bytes32rootHash,
    bytes32kiltAddress: bytes32kiltAddress,

    /// bytes32 role
    bytes32REGULATED_ERC20: bytes32REGULATED_ERC20,

    /// account address in vsszhang's MetaMask
    user1: user1,
    user2: user2,
    worker1: worker1,
    worker2: worker2,
    worker3: worker3,
    worker4: worker4,
    worker5: worker5,
    deployer: deployer,

    /// bytes32 properties
    bytes32CONTRACT_MAIN_KILT: bytes32CONTRACT_MAIN_KILT,
    bytes32UINT_APPROVE_THRESHOLD: bytes32UINT_APPROVE_THRESHOLD,

    /// contract address on Moonbase Alpha
    addressRegistry: addressRegistry,
    addressProperties: addressProperties,
    addressWhitelist: addressWhitelist,
    addressKiltProofsV1: addressKiltProofsV1,
    addressSampleToken: addressSampleToken,
    addressRegulatedTransfer: addressRegulatedTransfer,
    addressERC20: addressERC20,

    /// the provider of Moonbase Alpha testnet
    provider: provider,

}