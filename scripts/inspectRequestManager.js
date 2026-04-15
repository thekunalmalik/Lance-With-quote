module.exports = async function (callback) {
  try {
    const RequestManager = artifacts.require('RequestManager');
    const Projects = artifacts.require('Projects');

    const rm = await RequestManager.deployed();
    console.log('RequestManager deployed at:', rm.address);

    // projectsContract stored inside RequestManager
    try {
      const projectsAddr = await rm.projectsContract();
      console.log('RequestManager.projectsContract() =>', projectsAddr);
      try {
        const proj = await Projects.at(projectsAddr);
        const projectCount = await proj.projectCount();
        console.log('Projects.projectCount() =>', projectCount.toString());
      } catch (pErr) {
        console.warn('Could not instantiate Projects at stored address:', pErr.message || pErr);
      }
    } catch (e) {
      console.warn('Could not read rm.projectsContract():', e.message || e);
    }

    // requestCount and assignedFreelancer diagnostics
    try {
      const rc = await rm.requestCount();
      console.log('RequestManager.requestCount() =>', rc.toString());
    } catch (e) {
      console.warn('Could not read requestCount():', e.message || e);
    }

    try {
      const assigned1 = await rm.assignedFreelancer(1);
      console.log('assignedFreelancer[1] =>', assigned1);
    } catch (e) {
      console.warn('Could not read assignedFreelancer(1):', e.message || e);
    }

    // Try viewAllRequests
    try {
      const all = await rm.viewAllRequests();
      console.log('viewAllRequests: counts =>', all[0].length, all[1].length);
      console.log('Example requestIds:', all[0].slice(0,10).map(x => x.toString()));
    } catch (e) {
      console.error('viewAllRequests call error:', e);
    }

    // Try viewAcceptedProjectsByFreelancer for first account
    try {
      const accounts = await web3.eth.getAccounts();
      console.log('web3.eth.getAccounts() =>', accounts.slice(0,5));
      if (accounts.length > 0) {
        try {
          const accepted = await rm.viewAcceptedProjectsByFreelancer(accounts[0]);
          console.log('viewAcceptedProjectsByFreelancer(accounts[0]) => counts:', accepted[0].length);
        } catch (vfErr) {
          console.error('viewAcceptedProjectsByFreelancer call error:', vfErr);
        }
      }
    } catch (acctErr) {
      console.warn('Could not get accounts via web3:', acctErr.message || acctErr);
    }

    callback();
  } catch (err) {
    console.error('Inspect script failed:', err);
    callback(err);
  }
};
