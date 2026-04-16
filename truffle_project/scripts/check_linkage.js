const Projects = artifacts.require('Projects');
const RequestManager = artifacts.require('RequestManager');

module.exports = async function(callback) {
  try {
    const projects = await Projects.deployed();
    const requestManager = await RequestManager.deployed();
    console.log('Projects deployed at:', projects.address);
    console.log('RequestManager deployed at:', requestManager.address);
    console.log('Projects.requestManager:', await projects.requestManager());
    console.log('RequestManager.projectsContract:', await requestManager.projectsContract());
    console.log('RequestManager.requestCount:', (await requestManager.requestCount()).toString());
    callback();
  } catch (e) {
    callback(e);
  }
};
