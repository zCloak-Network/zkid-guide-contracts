
// const {expect, use, should} = require('chai');
// const { solidity }  = require("ethereum-waffle");
// const pify = require('pify')
// const Web3 = require('web3');
// use(solidity);

const ZeroKnowlegeProof = artifacts.require("ZeroKnowlegeProof");
contract('ZeroKnowlegeProof', accounts => {
    
    it('saveProof', async() =>{
        const programHash = '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457';
        const publicInputs = 'publicInputs';
        const result = true;


        const instance = await ZeroKnowlegeProof.deployed();
        await instance.addWhitelist(accounts[0]);
        const iswhite = instance.isWhitelist(accounts[0]);
        console.log(iswhite);
        const saveProof = await instance.saveProof(accounts[0], accounts[0], programHash, publicInputs, result);
        const tr = await instance.getProof(accounts[0], programHash, publicInputs);

        console.log(tr)
    });

    






})
