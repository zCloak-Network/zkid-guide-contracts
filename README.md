# zCloak-contract
Smart contracts of zkID on evm-compatible blockchain. 

## What is the zkID APP
Privacy-preserving identity service for Web 3.0.

## Main Contracts
- ProofStorage: Smart contract for storing the STARKS proofs.
- SimpleAggregator: Smart contract for uploading the verification result of STARKS proofs.
- ZcloakPoap: Smart contract for claiming your poap NFT

### Test Network
#### Moonbase Alpha:
|  Contract Names | Moonbase Addresses |
|  ----  | ----  |
| Registry address | 0xF2e7e0EeD35E60896cd3fA32050e2094A204f9a8 |
| Properties address | 0xb9AeE5617A5c1d93c5cc93C8ba6719365453f538 |
| AddressesUtils | 0x121249b88aa9DBDbee185DD46f9d8A7b114ce1dF |
| Bytes32sUtils | 0x9f9ef51DAdeD9C7f9A912716Cea94f437Fb4A1c1 |
| ProofStorage | 0x88D6e4866Cb8c3513CfB120c650f0C467B62f18f |
| ReadAccessController | 0xb4659a280870F81B18343Ba93f18cAd3a0E0993d |
| ReadAccessControllerAuth | 0xB99A78BA6993FF779df8Fe29cab77BE07bB126cf |
| Reputation | 0xDfE5aA0d1AA16e9Dea0DcAAcb7D06e460E107b24 |
| ReputationAuth | 0xa9B3B6D2F39844CCc42Fee98A7e879C12a43001C |
| SimpleAggregator | 0xf01FD25666baf302bbC6Fd5e6FA3197C7e7D06D6 |
| SimpleAggregatorAuth | 0xc3178AC43f1C6bdf0ED8B1f70c6527fD0Ac068D7 |
| Faucet | 0x999e3A4E5B93a74a30DdD96942662feEe78C9cF3 |
| PoapFactory | 0xDc29e8754cd4C49934e16B38c4DC505FC06d528B |
| ZcloakPoap* | 0xC8247C9b21d347A63844AeEED9586F0b211a4513 |

*ZcloakPoap：base on requestHash（0xda1235e894e29e85537cdd7c13b32c67e485ddc38c6ffa6f9a74d1e82fadb096）*

Try running some of the following tasks:

```shell
// hardhat basic using
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
npx hardhat remove-logs
npx hardhat coverage
npx hardhat preprocess
```