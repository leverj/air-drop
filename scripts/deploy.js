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
const social = require(config.social);

async function deploy() {
  let mod = {};
  let deployer, web3, token, airdrop, gasPrice

  async function start() {
    web3 = new Web3(new Web3.providers.HttpProvider(config.network))
    await createAccount()
    gasPrice = (await web3.eth.getGasPrice()) - 0;
    printGasPrice()
    gasPrice = Math.max(gasPrice, config.minGas);
    gasPrice = Math.min(gasPrice, config.maxGas);
    printGasPrice()
    await createContracts();
    await addUsers();
    await addSocial();
    if (process.env.NODE_ENV === 'develop') await sendTx(token, token.methods.transfer(airdrop._address, 1000e9))
    await removeDeployer()
  }

  async function createContracts() {
    token = await getOrCreateContract('Token', config.tokenAddress, HumanStandardToken, [1e18, 'TLEVERJ', 9, 'TLEV'])
    airdrop = await getOrCreateContract('Airdrop', config.airDropAddress, Airdrop, [config.owners.concat(deployer.address), token._address, config.airdrop.levPerUser])
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
      if (await airdrop.methods.users(chunks[i][0]).call())
        continue
      await sendTx(airdrop, airdrop.methods.addUsers(chunks[i]))
    }
  }

  async function addSocial() {
    let chunks = _.chunk(social, 200)
    console.log('working on social', social.length, chunks.length)
    for (let i = 0; i < chunks.length; i++) {
      let users = [], rewards = [];
      chunks[i].forEach((entry) => {
        users.push(entry[0])
        rewards.push(entry[1])
      })
      console.log('chunk', i, 'start', users[0], users[users.length - 1])
      let isPresent = (await airdrop.methods.social(users[0]).call()) - 0;
      if (isPresent)
        continue
      await sendTx(airdrop, airdrop.methods.addSocial(users, rewards))
    }
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

  async function removeDeployer(){
    await sendTx(airdrop, airdrop.methods.removeOwner(deployer.localAddress));
  }

  function printGasPrice(){
    console.log('gas price', web3.utils.fromWei(web3.utils.toBN(gasPrice), 'gwei'), 'gwei')
  }

  await start();
  return mod;
}

deploy().catch(console.error)
