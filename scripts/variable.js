const { ethers } = require("hardhat");

/// data
let fieldName = "age";
let cType = "0x7f2ef721b292b9b7d678e9f82ab010e139600558df805bbc61a0041e60b61a18";
let programHash = "0x8acf8f36dbd0407ced227c97f9f1bcf989c6affd32231ad56a36e9dfcd492610";
let proofCid = "QmdkZeSG8xzPgXRm7ZisqxG1Q71HfyPSqz7LU7RJHvz49S";
let rootHash = "0xed263f14fe2477486ebb59aaaec0c4cf1e2455ef6f3bda24c08700139ad59ce0";
let kiltAddress = "0xf85edd58bd7de60dac41894c508a1522f86d4b1066e3a4cbea3ab0353e659d57";
let expectResult = true;
let isPassed = true;
let unit = 10 ** 18;
// let transferAmount = 1;

/// role
let REGULATED_ERC20 = "REGULATED_ERC20";

/// account address in vsszhang's MetaMask
const user1 = "0x6B4e14C40457956b7cB80f2391124951ad444e31";
const user2 = "0x07b1A69FBaf43199b4720353ae60B239931C55E0";
const user3 = "0x8607514B15762E53612bCB3A3e4f1aDA226170c1";
const worker1 = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac";
const worker2 = "0x5C88cC2C1DC4fCd746C2D41b95Eb036FaDF05Fb2";
const worker3 = "0x59B6D4733176346616564E8ACd781a8169B35a6D";
const worker4 = "0x34Ef2480E87A50EBad888653D6B06b1bD7430064";
const worker5 = "0x36F352162c97cB5C6d009468eC926014A0B189d8";
const worker6 = "0x8607514B15762E53612bCB3A3e4f1aDA226170c1";
const deployer = "0x6f56C250992655f9ca83E3246dcBDC9555A6771F";

/// contract address on Moonbase Alpha
const addressRegistry = "0x5417145E1e483f24FF8a15c9ebBee24fff179bc1";
const addressProperties = "0xc5217f20Cc3956c74aff65A01e550ed7cC4eD6Ef";
const addressWhitelist = "0x4Cc6Ce9360d2249ad13Fe300D6Ac85B9CD3a538b";
const addressKiltProofsV1 = "0x72AcB0f573287B3eE0375964D220158cD18465cb";
const addressSampleToken = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
const addressRegulatedTransfer = "0xC8e2409A0E15CBe517E178972855D486e7E881e1";
const addressERC20 = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";
const addressUSDT = "0x8AE8f26e9E53ACE3d9A26b5d1573F5b9F2A1e699";

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

/// signer
const deployerAccount_from = {
    privateKey: '0bc365e0e28a4134f0ce5568f562e0adeeefda7edc636d443cdab3ed8a4e92fd',
};
let deployerWallet = new ethers.Wallet(deployerAccount_from.privateKey, provider);

const user1Account_from = {
    privateKey: '1f2c36eed30b62e92c6bbb8fc3c3f02b2be01acdc6e3cb797dbfebf231fcc337',
};
let user1Wallet = new ethers.Wallet(user1Account_from.privateKey, provider);

const user2Account_from = {
    privateKey: '38bfa6f5886c3da70f2efbf7b3d4cd01c3bd4041295a446000236933f478dfe5',
};
let user2Wallet = new ethers.Wallet(user2Account_from.privateKey, provider);

const user3Account_from = {
    privateKey: '779782a9534e6ef57b57001af3b960c0607451a7414e8c88208386dff10b812c',
};
let user3Wallet = new ethers.Wallet(user1Account_from.privateKey, provider);

const worker1Account_from = {
    privateKey: '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
};
let worker1Wallet = new ethers.Wallet(worker1Account_from.privateKey, provider);

const worker2Account_from = {
    privateKey: '1f2408543a2e34321f989e68306888e04d45962c3463a0771240754930fd9896', 
};
let worker2Wallet = new ethers.Wallet(worker2Account_from.privateKey, provider);

const worker3Account_from = {
    privateKey: 'f003c162099198d8f4776019000e7bb7a1d3fddf03a1308514642380686cabdf',
};
let worker3Wallet = new ethers.Wallet(worker3Account_from.privateKey, provider);

const worker4Account_from = {
    privateKey: 'fd676d599f9cbd0e8ecaeba558bcef491991c76ca6772d2421ca251e29e07b44',
};
let worker4Wallet = new ethers.Wallet(worker4Account_from.privateKey, provider);

const worker5Account_from = {
    privateKey: 'c51e42d27d94f5f3e33b07602e33b8b3d19f398992889b56a250df6086f28c56',
};
let worker5Wallet = new ethers.Wallet(worker5Account_from.privateKey, provider);

/// data type transfer: string => bytes32
// var stringCType = new String(cType);
// var bytes32CType = stringCType.valueOf();

// var stringProgramHash = new String(programHash);
// var bytes32ProgramHash = stringProgramHash.valueOf();

// var stringRootHash = new String(rootHash);
// var bytes32rootHash = stringRootHash.valueOf();

// var stringKiltAddress = new String(kiltAddress);
// var bytes32kiltAddress = stringKiltAddress.valueOf();
// let bytes32kiltAddress = "0xf85edd58bd7de60dac41894c508a1522f86d4b1066e3a4cbea3ab0353e659d55";

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
    unit: unit,
    // transferAmount: transferAmount,

    /// bytes32 data
    // bytes32CType: bytes32CType,
    // bytes32ProgramHash: bytes32ProgramHash,
    // bytes32rootHash: bytes32rootHash,
    // bytes32kiltAddress: bytes32kiltAddress,

    /// bytes32 role
    bytes32REGULATED_ERC20: bytes32REGULATED_ERC20,

    /// account address in vsszhang's MetaMask
    user1: user1,
    user2: user2,
    user3: user3,
    worker1: worker1,
    worker2: worker2,
    worker3: worker3,
    worker4: worker4,
    worker5: worker5,
    worker6: worker6,
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
    addressUSDT: addressUSDT,

    /// the provider of Moonbase Alpha testnet
    provider: provider,

    /// signer
    deployerWallet: deployerWallet,
    user1Wallet: user1Wallet,
    user2Wallet: user2Wallet,
    user3Wallet: user3Wallet,
    worker1Wallet: worker1Wallet,
    worker2Wallet: worker2Wallet,
    worker3Wallet: worker3Wallet,
    worker4Wallet: worker4Wallet,
    worker5Wallet: worker5Wallet,
}