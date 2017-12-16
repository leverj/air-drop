// const tokenAddress = '0xccF9A73a58B5e5044277A5bc0e8Bf452C9147771'
// const airDropAddress = '0xf5f137E135420e3B5B60d7566Fe1fFC9CCb099AD';
// const airDropAddress = '0x99925877755945C8707808a433a962d088188dEC';

const config = require('./conf').configuration;
const key = require('./conf').key;
const Web3 = require('web3');
const _ = require('lodash');
const Airdrop = require('../build/contracts/Leverjbounty');
const HumanStandardToken = require('../build/contracts/HumanStandardToken');
const users = require(config.users);

async function deploy() {
  let mod = {};
  let deployer, web3, token, airdrop, gasPrice
  let freeze = Math.round((new Date(config.airdrop.freeze).getTime()) / 1000)
  let expiry = Math.round((new Date(config.airdrop.expiry).getTime()) / 1000)

  async function start() {
    web3 = new Web3(new Web3.providers.HttpProvider(config.network))
    await createAccount()
    gasPrice = Math.max((await web3.eth.getGasPrice()) - 0, config.minGas);
    await createContracts();
    await addUsers();
  }

  async function createContracts() {
    token = await getOrCreateContract('Token', config.tokenAddress, HumanStandardToken, [1e18, 'TLEVERJ', 9, 'TLEV'])
    airdrop = await getOrCreateContract('Airdrop', config.airDropAddress, Airdrop, [config.owners.concat(deployer.address), token._address, config.airdrop.levPerUser, freeze, expiry])
  }

  async function createAccount() {
    deployer = await web3.eth.accounts.privateKeyToAccount(key);
    web3.eth.accounts.wallet.add(deployer);
    console.log('deployer', deployer.address)
  }

  async function addUsers() {
    let chunks = _.chunk(users, 200)
    console.log(users.length, chunks.length)
    for (let i = 0; i < chunks.length; i++) {
      console.log('chunk', i, 'start', chunks[i][0], chunks[i][chunks[i].length - 1])
      await addChunk(chunks[i])
    }
  }

  async function addChunk(chunk) {
    if (await airdrop.methods.users(chunk[0]).call())
      return
    // let filtered = await filterUsers(chunk);
    // console.log('chunk', filtered.length)
    await sendTx(airdrop, airdrop.methods.addUsers(chunk))
  }

  async function filterUsers(users) {
    let filtered = []
    let promises = users.map(user => airdrop.methods.users(user).call())
    let result = await Promise.all(promises)

    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      if (!result[i]) filtered.push(users[i])
    }
    return filtered;
  }

  async function getOrCreateContract(name, address, contractJson, values) {
    let deployed;
    if (!address) {
      console.log(`Deploying ${name} contract...`)
      const contract = await deploy(contractJson, values);
      // configuration.feeAddress = contract.contractAddress;
      deployed = new web3.eth.Contract(contractJson.abi, contract.contractAddress);
      // updateConfiguration = true;
    } else {
      // Create the instance of the contract with configuration.feeAddress
      deployed = new web3.eth.Contract(contractJson.abi, address);
    }
    console.log(name, deployed._address)
    return deployed;
  }

  async function deploy(contractJson, arguments) {
    const contract = new web3.eth.Contract(contractJson.abi);
    let tx = contract.deploy({data: contractJson.bytecode, arguments: arguments});
    console.log({
      compileVersion: contractJson.compiler.version,
      constructor: tx.encodeABI().substr(contractJson.bytecode.length),
    })
    return await sendTx(contract, tx)
  }

  async function sendTx(contract, tx) {
    contract.options.from = deployer.address;
    let gas = await tx.estimateGas();
    console.log('gas', gas, gasPrice);
    return await tx.send({from: deployer.address, gas, gasPrice})
  }

  await start();
  return mod;
}

deploy().catch(console.error)
