const { ethers } = require("hardhat");

/// data
let fieldName = "age";
let cType = "0x7f2ef721b292b9b7d678e9f82ab010e139600558df805bbc61a0041e60b61a18";
let programHash = "0x8acf8f36dbd0407ced227c97f9f1bcf989c6affd32231ad56a36e9dfcd492610";
let newProgramHash = "0x9acf8f36dbd0407ced227c97f9f1bcf989c6affd32231ad56a36e9dfcd493214";
let proofCid = "QmdkZeSG8xzPgXRm7ZisqxG1Q71HfyPSqz7LU7RJHvz49S";
let newProofCid = "QemkZeSG8xzPgXRm7ZisqxG1Q71HfyPSqz7LU7RJHvz56F";
let rootHash = "0xed263f14fe2477486ebb59aaaec0c4cf1e2455ef6f3bda24c08700139ad59ce0";
let kiltAddress = "0xf85edd58bd7de60dac41894c508a1522f86d4b1066e3a4cbea3ab0353e659d56";
let newKiltAddress = "0xf76edd58bd7de60dac41894c508a1522f86d4b1066e3a4cbea3ab0353e659d78"
let expectResult = true;
let isPassed = true;
let amount = 1 * 10 **18;

/// role
let REGULATED_ERC20 = "REGULATED_ERC20";

/// account address in vsszhang's MetaMask
const deployer = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const user1 = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const user2 = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";
const worker1 = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";
const worker2 = "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65";
const worker3 = "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc";
// const worker4 = "";
// const worker5 = "";
// const worker6 = "";

/// contract address on Moonbase Alpha
const addressRegistry = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const addressProperties = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const addressWhitelist = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const addressKiltProofsV1 = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const addressSampleToken = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const addressRegulatedTransfer = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const addressERC20 = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

/// the provider of Moonbase Alpha testnet
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
// const providerRPC = {
//     moonbase: {
//         name: 'moonbase-alpha',
//         rpc: 'https://rpc.testnet.moonbeam.network',
//         chainId: 1287,
//     },
// };
// const provider = new ethers.providers.StaticJsonRpcProvider(
//     providerRPC.moonbase.rpc,
//     {
//         chainId: providerRPC.moonbase.chainId,
//         name: providerRPC.moonbase.name,
//     }
// );

/// signer
const deployerAccount_from = {
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
};
let deployerWallet = new ethers.Wallet(deployerAccount_from.privateKey, provider);

const user1Account_from = {
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
};
let user1Wallet = new ethers.Wallet(user1Account_from.privateKey, provider);

const user2Account_from = {
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
};
let user2Wallet = new ethers.Wallet(user2Account_from.privateKey, provider);

const worker1Account_from = {
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
};
let worker1Wallet = new ethers.Wallet(worker1Account_from.privateKey, provider);

const worker2Account_from = {
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
};
let worker2Wallet = new ethers.Wallet(worker2Account_from.privateKey, provider);

const worker3Account_from = {
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
};
let worker3Wallet = new ethers.Wallet(worker3Account_from.privateKey, provider);

// const worker4Account_from = {
//     privateKey: 'fd676d599f9cbd0e8ecaeba558bcef491991c76ca6772d2421ca251e29e07b44',
// };
// let worker4Wallet = new ethers.Wallet(worker4Account_from.privateKey, provider);

// const worker5Account_from = {
//     privateKey: 'c51e42d27d94f5f3e33b07602e33b8b3d19f398992889b56a250df6086f28c56',
// };
// let worker5Wallet = new ethers.Wallet(worker5Account_from.privateKey, provider);

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

module.exports = {
    /// data
    fieldName: fieldName,
    cType: cType,
    programHash: programHash,
    newProgramHash: newProgramHash,
    proofCid: proofCid,
    newProofCid: newProofCid,
    rootHash: rootHash,
    kiltAddress: kiltAddress,
    newKiltAddress: newKiltAddress,
    expectResult: expectResult,
    isPassed: isPassed,
    amount: amount,

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
    worker1: worker1,
    worker2: worker2,
    worker3: worker3,
    // worker4: worker4,
    // worker5: worker5,
    // worker6: worker6,
    deployer: deployer,

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

    /// signer
    deployerWallet: deployerWallet,
    user1Wallet: user1Wallet,
    user2Wallet: user2Wallet,
    worker1Wallet: worker1Wallet,
    worker2Wallet: worker2Wallet,
    worker3Wallet: worker3Wallet,
    // worker4Wallet: worker4Wallet,
    // worker5Wallet: worker5Wallet,
}