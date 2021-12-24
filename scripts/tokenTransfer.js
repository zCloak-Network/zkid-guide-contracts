///
/// @author vsszhang
/// @dev this script shows you the rTransfer full stream, but you should know one
/// significant thing, that is you should addProof and addVerification first.
/// @notice test network: Moonbase Alpha
///
const { ethers } = require("hardhat");

const { cType, programHash, expectResult } = require("./variable.js");

const addressRT = "CONTRACT_RT_ADDRESS";
const addressKilt = "CONTRACT_KILT_ADDRESS";
const addressSampleToken = "CONTRACT_TOKEN_ADDRESS";

async function main() {
    // generate contract instance
    const [ owner, user1, user2 ] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SampleToken", owner);
    const token = await Token.attach(addressSampleToken);

    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer", owner);
    const rt = await RegulatedTransfer.attach(addressRT);

    // firstly, owner transfer 20 tokens to user1
    console.log("owner's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(owner.address))) + " TOKEN");
    console.log("Waiting for owner transfers 20 tokens to user1...");
    await (await token.transfer(user1.address, ethers.utils.parseEther("20.0"))).wait();
    console.log("Transfer Successfully");
    console.log("owner's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(owner.address))) + " TOKEN");

    console.log("User1 approve 10 tokens to contract 'RegulatedTransfer'...");
    await (await token.connect(user1).approve(rt.address, ethers.utils.parseEther("10.0"))).wait();

    // show allowance and balance
    console.log("Contract RegulatedTransfer allowance: ", await ethers.utils.formatEther(await ethers.BigNumber.from(await token.allowance(user1.address, rt.address))) + " TOKEN");
    console.log("User1's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(user1.address))) + " TOKEN");
    console.log("User2's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(user2.address))) + " TOKEN");

    // add kiltProof into our trusted program
    await (await rt.addRule(addressSampleToken, addressKilt, cType, programHash, expectResult)).wait();

    // contract RegulatedTransfer will transfer user1's 5 tokens to user2
    var transferAmount = await ethers.utils.parseEther("5.0");
    const txRTransfer = await rt.connect(user1).rTransfer(addressKilt, addressSampleToken, user2.address, transferAmount, cType, programHash);
    await txRTransfer.wait();
    console.log("User1 rTransfer 5 tokens to user2 Successfully");

    // show allowance and balance
    console.log("Contract RegulatedTransfer allowance: ", await ethers.utils.formatEther(await ethers.BigNumber.from(await token.allowance(user1.address, rt.address))) + " TOKEN");
    console.log("User1's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(user1.address))) + " TOKEN");
    console.log("User2's balance: " + await ethers.utils.formatEther(await ethers.BigNumber.from(await token.balanceOf(user2.address))) + " TOKEN");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });