const Web3 = require('web3');
const fs = require('fs');
const web3 = new Web3();
let social = []
for (let i = 0; i < 200; i++) {
  social.push([web3.eth.accounts.create().address, (i+1)*1e9])
}
console.log(social)
fs.writeFileSync('./social.json', JSON.stringify(social, null, 2));