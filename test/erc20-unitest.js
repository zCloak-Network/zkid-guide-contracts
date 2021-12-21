const { assert,expect } = require("chai");
const { ethers } = require("hardhat");

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

  it("TransferFrom shoul work", async function() {
    // TODO:
  })


  it("Transferred amount exceeds balance should fail", async function() {
    // TODO:
  })

  it("TransferFrom amount exceeds balance should fail", async function() {
    // TODO:
  })

});
