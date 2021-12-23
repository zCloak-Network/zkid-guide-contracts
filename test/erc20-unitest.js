const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

// the COIN's decimal is 18
const COIN = ethers.BigNumber.from("0xde0b6b3a7640000");

describe("SampleToken", function () {

  beforeEach(async function () {
    [this.owner, this.user1, this.user2] = await ethers.getSigners();
    this.SampleToken = await ethers.getContractFactory("SampleToken");
    this.token = await this.SampleToken.deploy("USDT", "USDT");
    await this.token.deployed();
  })


  it("Should mint to deployer total supply", async function () {

    // assert
    assert.equal((await this.token.balanceOf(this.owner.address)).toString(), COIN.mul(100).toString());
    // expect
    expect(await this.token.balanceOf(this.owner.address)).to.equal(COIN.mul(100));
  });

  it("Transfer should work", async function () {
    let user1Balance = await this.token.balanceOf(this.user1.address);
    await this.token.connect(this.owner).transfer(this.user1.address, COIN);

    // owner's balance should be (100 - 1) COIN
    assert(await this.token.balanceOf(this.owner.address), COIN.mul(100 - 1));
    assert(await this.token.balanceOf(this.user1.address), user1Balance.add(COIN));

  })

  it("Approve and allowance should work", async function () {
    var amount = await ethers.utils.parseEther("10.0");
    await this.token.approve(this.user1.address, amount);
    // user2's allowance should be 10 USDT
    expect(await this.token.allowance(this.owner.address, this.user1.address)).to.equal(await ethers.utils.parseEther("10.0"));
  })

  it("TransferFrom should work", async function () {
    var amount = await ethers.utils.parseEther("10.0");
    await this.token.approve(this.user1.address, amount);
    // user1's allowance should be 10 USDT
    expect(await this.token.allowance(this.owner.address, this.user1.address)).to.equal(await ethers.utils.parseEther("10.0"));

    // user1 call function transferFrom()
    var transferAmount = await ethers.utils.parseEther("1.0");
    await this.token.connect(this.user1).transferFrom(this.owner.address, this.user1.address, transferAmount);
    // user1's allowance should be 9 USDT
    expect(await this.token.allowance(this.owner.address, this.user1.address)).to.equal(await ethers.utils.parseEther("9.0"));
    // user1's balance should be 1 USDT
    expect(await this.token.balanceOf(this.user1.address)).to.equal(await ethers.utils.parseEther("1.0"));
  })

});
