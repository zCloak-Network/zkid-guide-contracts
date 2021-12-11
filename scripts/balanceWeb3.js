// TODO: integrate web3 in hre
const Web3 = require('web3')
const rpcURL = 'https://rpc.testnet.moonbeam.network'
const web3 = new Web3(rpcURL);


const abiSampleToken = require("../artifacts/contracts/SampleToken.sol/SampleToken.json");
const stAddress = "0xE29e1CFDC236119194D7a6AbFFC8b0F6d2aDd6e5";

let contract = new web3.eth.Contract(abiSampleToken.abi, stAddress);
async function getBalance() {
    balance = await contract.methods.balanceOf('0x6f56C250992655f9ca83E3246dcBDC9555A6771F').call();
    return balance;
}


getBalance().then(function (result) {
    console.log(result);
});