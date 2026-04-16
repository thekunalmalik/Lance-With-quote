const Projects = artifacts.require(" Projects\);
const RequestManager = artifacts.require(\RequestManager\);

module.exports = async function(callback) {
 try {
 const projects = await Projects.deployed();
 const requestManager = await RequestManager.deployed();
 callback();
 } catch (e) {
 callback(e);
 }
};
