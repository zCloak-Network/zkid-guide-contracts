const { assert, expect } = require("chai");
const fs = require('fs');

var Web3 = require('web3');
var web3 = new Web3('http://localhost:8545');

const account = {
    owner: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    user1: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    user2: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
}

var sourceFile = fs.readFileSync("../artifacts/contracts/test/MockERC1363.sol/MockERC1363.json");
var source = JSON.parse(sourceFile);
var abi = source.abi;
var bytecode = source.bytecode;

describe('ERC1363_unit_test', function () {

    var mockERC1363;
    var mockERC1363Tx; 

    beforeEach(async function () {
        mockERC1363 = await new web3.eth.Contract(abi);
        mockERC1363Tx = await mockERC1363.deploy({
            data: bytecode,
            arguments: ['MyToken', 'MTK'],
        })
        .send({
            from: account.owner,
            gas: 1500000,
            gasPrice: '30000000000000'
        })
        .on('receipt', function(receipt){
            mockERC1363.options.address = receipt.contractAddress;
        });

    });

    // describe("check whether contract deploy successfully or not", function () {
    //     it("owner's balance should be 100", async function () {
    //         assert(token.balanceOf(owner.address), 100);
    //     });
    // });

    describe("call transferAndCall without 'data'", function () {
        it("Should emit 'Transfer' event if transfer successfully", async function () {
            let tx = await mockERC1363.methods.transferAndCall(account.user1, 10).send({from: account.owner});
            await expect(tx)
                .to.emit(token, 'Transfer')
                .withArgs(owner.address, user1.address, 10);
        });

        it("'msg.sender' tokens decrease by 'mount', 'to' tokens increase by 'mount' ", async function () {
            await mockERC1363.methods.transferAndCall(account.user1, 10).send({from: account.owner});
            assert(web3.utils.fromWei(await web3.eth.getBalance(account.owner)), 100 -10);
            assert(web3.utils.fromWei(await web3.eth.getBalance(account.user1)), 0 + 10);
        });
    });

    // describe("approveAndCall", function () {
    //     it("Should emit 'Approval' event if approve successfully", async function () {
    //         await expect(token.approve(user1.address, 10))
    //             .to.emit(token, 'Approval')
    //             .withArgs(owner.address, user1.address, 10);
    //     });
    // });

});