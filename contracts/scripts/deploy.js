import hre from "hardhat";
// const hre = require("hardhat");

async function main() {
  console.log("deploy.js is starting deployment...");
  
  const IPRightsRegistry = await hre.ethers.getContractFactory("IPRightsRegistry");
  console.log("Deploying IPRightsRegistry...");
  
  const registry = await IPRightsRegistry.deploy();
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log("IPRightsRegistry deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
