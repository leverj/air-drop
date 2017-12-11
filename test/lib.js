const Web3 = require('web3');
const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');

module.exports = (function () {
  let lib = {};
	let snapshotid;
  // lib.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  lib.web3 = new Web3(web3.currentProvider);
  lib.ethRPC = new EthRPC(web3.currentProvider);
  lib.deploy = async function (abi, bytecode, user, arguments) {
    const contract = new lib.web3.eth.Contract(abi);
    return await contract.deploy({data: bytecode, arguments: arguments}).send({
      from: user,
      gas: 4e6,
      gasPrice: '30000000000000'
    });
  };

  lib.mineTo = async function (block) {
    let blockNumber = await lib.web3.eth.getBlockNumber();
    if (blockNumber >= block) return;
    await lib.mine(block - blockNumber);
  };

  lib.mine = async function (blocks) {
    for (let i = 0; i < blocks; i++) {
      await lib.ethRPC.sendAsync({method: 'evm_mine'});
    }
  };

  lib.currentBlock = async function () {
    return await lib.web3.eth.getBlockNumber();
  };

  lib.getCurrentTime = async function () {
    let block = await lib.web3.eth.getBlock('latest');
    return block.timestamp;
  };

  lib.forceTime = async function (time) {
    await lib.ethRPC.sendAsync({method: 'evm_increaseTime', params: [time]});
    await lib.mine(1);
  };

	lib.delay = function (time) {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, time)
		})
	}

	lib.reset = async function (){
	  await lib.ethRPC.sendAsync({method:'evm_revert', params:[snapshotid]});
	}

	lib.snapshot = async function (){
	  snapshotid = await lib.ethRPC.sendAsync({method:'evm_snapshot'});
	}

  return lib;
})();
