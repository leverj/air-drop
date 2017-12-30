const Web3 = require('web3');
const web3 = new Web3();
const users = require('./users.json')

for (let i = 0; i < users.length; i++) {
  let user = users[i];
  if(!web3.utils.isAddress(user)){
    console.log('invalid address', user);
    continue
  }
  for (let j = i+1; j < users.length; j++) {
    if(users[j] === user) console.log('duplicate user', user)
  }
}


const socials = require('./social.json')
console.log('total socials', socials.length)
for (let i = 0; i < socials.length; i++) {
  let social = socials[i];
  if(!web3.utils.isAddress(social[0])){
    console.log('invalid address', social[0]);
    continue
  }
  for (let j = i+1; j < socials.length; j++) {
    if(socials[j][0] === social[0]) console.log('duplicate social', social[0], social[1] + socials[j][1])
  }
}

/*
16152.71659
35190.61584
51343.33243
 */