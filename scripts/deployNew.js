const { ethers } = require("hardhat");

async function main() {
    /// variable (example)
    let cType = "0x7f2ef721b292b9b7d678e9f82ab010e139600558df805bbc61a0041e60b61a18";
    let programHash = "0x8acf8f36dbd0407ced227c97f9f1bcf989c6affd32231ad56a36e9dfcd492610";
    let expectResult = true;

    /// provider who connect to Moonbase Alpha
    const providerRPC = {
        moonbase: {
            name: 'moonbase-alpha',
            rpc: 'https://rpc.testnet.moonbeam.network',
            chainId: 1287,
        },
    };
    const provider = await new ethers.providers.StaticJsonRpcProvider(
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
    let deployer = await new ethers.Wallet(deployerAccount_from.privateKey, provider);

    const user1Account_from = {
        privateKey: '1f2c36eed30b62e92c6bbb8fc3c3f02b2be01acdc6e3cb797dbfebf231fcc337',
    };
    let user1 = await new ethers.Wallet(user1Account_from.privateKey, provider);

    const worker1Account_from = {
        privateKey: '5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
    };
    let worker1 = await new ethers.Wallet(worker1Account_from.privateKey, provider);

    /// you can add other characters like above, it will create a signer

    /// deploy the contract
    const Registry = await ethers.getContractFactory("Registry", deployer);
    const Properties = await ethers.getContractFactory("Properties", deployer);
    const Whitelist = await ethers.getContractFactory("Whitelist", deployer);
    const KiltProofsV1 = await ethers.getContractFactory("KiltProofsV1", deployer);
    const RegulatedTransfer = await ethers.getContractFactory("RegulatedTransfer", deployer);
    const SampleToken = await ethers.getContractFactory("SampleToken", deployer);

    const registry = await Registry.deploy();
    await registry.deployed();

    const properties = await Properties.deploy();
    await properties.deployed();

    const whitelist = await Whitelist.deploy();
    await whitelist.deployed();

    const kilt = await KiltProofsV1.deploy(registry.address);
    await kilt.deployed();

    const regulatedTransfer = await RegulatedTransfer.deploy(registry.address);
    await regulatedTransfer.deployed();

    const sampleToken = await SampleToken.deploy("TOKEN_NAME", "TOKEN_SYMBOL");
    await sampleToken.deployed();

    console.log("Registry address: ", registry.address);
    console.log("Properties address: ", properties.address);
    console.log("Whitelist address: ", whitelist.address);
    console.log("Kilt address: ", kilt.address);
    console.log("RegulatedTransfer address: ", regulatedTransfer.address);
    console.log("SampleToken address: ", sampleToken.address);

    /// basic conditions
    /// set up whitelist
    await registry.setAddressProperty(properties.CONTRACT_WHITELIST(), whitelist.address);
    console.log("CONTRACT_WHITELIST address: ", await registry.addressOf(properties.CONTRACT_WHITELIST()));
    console.log("Whitelist address: ", whitelist.address);

    await whitelist.addWorker(worker1.address);
    console.log("worker1 is or not? ", await whitelist.isWorker(worker1.address));
    /// you can add other characters as worker

    /// set threshold as you want, default is 1
    await registry.setUintProperty(properties.UINT_APPROVE_THRESHOLD(), 1);
    console.log("UINT_APPROVE_THRESHOLD number: ", (await registry.uintOf(properties.UINT_APPROVE_THRESHOLD())).toString());

    /// set CONTRACT_MAIN_KILT
    await registry.setAddressProperty(properties.CONTRACT_MAIN_KILT(), kilt.address);
    console.log("CONTRACT_MAIN_KILT address: ", await registry.addressOf(properties.CONTRACT_MAIN_KILT()));

    /// TODO: grant role to regulatedTransfer.address?
    await kilt.grantRole(kilt.REGULATED_ERC20(), regulatedTransfer.address);
    console.log("RegulatedTransfer has REGULATED_ERC20 role? ", kilt.hasRole(kilt.REGULATED_ERC20(), regulatedTransfer.address));

    await regulatedTransfer.addRule(sampleToken.address, kilt.address, cType, programHash, expectResult);
    console.log("Successfully add new rule for third party.");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });