const _Web3 = require('web3');
const Web3 = _Web3 && _Web3.default ? _Web3.default : _Web3;
const path = require('path');

const RM = require(path.join(__dirname, '..', 'src', 'contracts', 'RequestManager.json'));
const PJ = require(path.join(__dirname, '..', 'src', 'contracts', 'Projects.json'));

async function main() {
  const web3 = new Web3('http://127.0.0.1:7545');
  const networkId = await web3.eth.net.getId();

  const rmAddr = RM.networks && RM.networks[networkId] ? RM.networks[networkId].address : null;
  const pjAddr = PJ.networks && PJ.networks[networkId] ? PJ.networks[networkId].address : null;

  if (!rmAddr) {
    console.error('RequestManager address not found in src/contracts/RequestManager.json for network', networkId);
    process.exit(1);
  }

  const rm = new web3.eth.Contract(RM.abi, rmAddr);
  const pj = pjAddr ? new web3.eth.Contract(PJ.abi, pjAddr) : null;

  try {
    console.log('Looking for pending requests via viewAllRequests (fast)');
    const all = await rm.methods.viewAllRequests().call();
    const reqIds = all[0] || [];
    const projIds = all[1] || [];
    const freelancers = all[2] || [];
    const statuses = all[4] || [];

    let target = null;
    for (let i = 0; i < reqIds.length; i++) {
      const status = parseInt(String(statuses[i] || '0'), 10);
      if (status === 0) { // Pending
        target = { requestId: String(reqIds[i]), projectId: String(projIds[i]), freelancer: freelancers[i] };
        break;
      }
    }

    if (!target) {
      console.log('No pending requests found via viewAllRequests; trying events fallback');
      const sent = await rm.getPastEvents('RequestSent', { fromBlock: 0, toBlock: 'latest' });
      const accepted = await rm.getPastEvents('RequestAccepted', { fromBlock: 0, toBlock: 'latest' });

      // find requestIds that were sent but not accepted
      const sentMap = {};
      for (const ev of sent) {
        const rv = ev.returnValues || {};
        const rid = rv.requestId || rv[0] || rv['requestId'];
        const pid = rv.projectId || rv[1] || rv['projectId'];
        if (rid && pid) sentMap[String(rid)] = String(pid);
      }

      const acceptedSet = new Set((accepted || []).map(ev => String(ev.returnValues.requestId || ev.returnValues[0] || ev.returnValues['requestId'])));

      for (const [rid, pid] of Object.entries(sentMap)) {
        if (!acceptedSet.has(rid)) {
          target = { requestId: rid, projectId: pid };
          break;
        }
      }
    }

    if (!target) {
      console.log('No candidate pending request found to accept. Exiting.');
      process.exit(0);
    }

    console.log('Candidate request found:', target);

    // Fetch project details
    const projectContract = pj || new web3.eth.Contract(PJ.abi, (await rm.methods.projectsContract().call()));
    const projectData = await projectContract.methods.getProject(target.projectId).call();
    const reward = projectData[3] || projectData.reward;
    const employer = projectData[5] || projectData.employer;

    console.log('Project', target.projectId, 'reward (wei):', reward.toString(), 'employer:', employer);

    // Accept the request by calling acceptRequest(requestId) from employer sending reward
    console.log('Sending acceptRequest transaction...');
    const tx = await rm.methods.acceptRequest(target.requestId).send({ from: employer, value: reward, gas: 6721975 });
    console.log('acceptRequest tx receipt:', tx.transactionHash || tx.transactionHash || tx.tx || tx);
    console.log('Request accepted on-chain; assignedFreelancer should be set now.');
  } catch (err) {
    console.error('Auto-accept script failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
