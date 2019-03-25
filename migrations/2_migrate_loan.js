const LoanRequestPlatform = artifacts.require("LoanRequestPlatform");

module.exports = function(deployer) {
  deployer.deploy(LoanRequestPlatform);
};
