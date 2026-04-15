const Projects = artifacts.require("Projects");
const RequestManager = artifacts.require("RequestManager");
const Escrow = artifacts.require("Escrow");

module.exports = async function (deployer) {
  // Deploy Projects contract
  await deployer.deploy(Projects);
  const projectsInstance = await Projects.deployed();
  console.log("Projects contract deployed at:", projectsInstance.address);

  // Deploy RequestManager with Projects contract address
  await deployer.deploy(RequestManager, projectsInstance.address);
  const requestManagerInstance = await RequestManager.deployed();
  console.log("RequestManager contract deployed at:", requestManagerInstance.address);

  // Escrow will be deployed dynamically by RequestManager, so no need to deploy here
  console.log("Deployment completed successfully!");
};
