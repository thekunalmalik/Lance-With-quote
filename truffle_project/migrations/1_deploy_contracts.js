const Projects = artifacts.require("Projects");
const RequestManager = artifacts.require("RequestManager");

module.exports = async function (deployer) {
  // Deploy Projects contract first
  await deployer.deploy(Projects);
  const projectsInstance = await Projects.deployed();

  // Now deploy RequestManager with the address of the deployed Projects contract
  await deployer.deploy(RequestManager, projectsInstance.address);
  const requestManagerInstance = await RequestManager.deployed();

  // Link the async RequestManager contract to Projects so it can close projects on behalf of the employer
  await projectsInstance.setRequestManager(requestManagerInstance.address);
};
