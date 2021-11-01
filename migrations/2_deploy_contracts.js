const ZeroKnowlegeProof = artifacts.require("ZeroKnowlegeProof");
const ReliableInstitution = artifacts.require("ReliableInstitution");

module.exports = function (deployer) {
    deployer.deploy(ZeroKnowlegeProof);
}