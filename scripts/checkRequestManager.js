const path = require('path');
const _Web3 = require('web3');
const Web3 = _Web3 && _Web3.default ? _Web3.default : _Web3;
const RM = require(path.join(__dirname, '..', 'src', 'contracts', 'RequestManager.json'));

(async function(){
  try {
    const web3 = new Web3('http://127.0.0.1:7545');
    const netId = await web3.eth.net.getId();
    console.log('networkId:', netId);
    const rmAddr = RM.networks && RM.networks[netId] ? RM.networks[netId].address : null;
    console.log('RequestManager address:', rmAddr);
    if (!rmAddr) return console.error('No RequestManager address for this network in RequestManager.json');
    const rm = new web3.eth.Contract(RM.abi, rmAddr);
    try {
      const projAddr = await rm.methods.projectsContract().call();
      console.log('projectsContract():', projAddr);
    } catch (e) {
      console.error('projectsContract() call failed:', e && e.message ? e.message : e);
    }
    try {
      const rCount = await rm.methods.requestCount().call();
      console.log('requestCount():', rCount.toString());
    } catch (e) {
      console.error('requestCount() call failed:', e && e.message ? e.message : e);
    }
    try {
      console.log('Attempting viewAllRequests()...');
      const all = await rm.methods.viewAllRequests().call();
      console.log('viewAllRequests returned counts:', (all[0]||[]).length, (all[1]||[]).length);
    } catch (e) {
      console.error('viewAllRequests() failed:', e && e.message ? e.message : e);
    }
  } catch (err) {
    console.error('checkRequestManager error:', err && err.message ? err.message : err);
  }
})();
