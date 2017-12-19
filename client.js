contractAddress = '0x803631F30592d2769BB87073bf820bFf9481D8c7';
tokenAddress = '0x3e5400d53c4167fc8f0fb81fa8b0104c6d279775';
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io'))

async function client() {
  let storage
  try {
    window.localStorage.test = 1
    storage = window.localStorage
  }
  catch (e) {
    storage = {}
  }

  function setLocal(key, value) {
    storage[key] = value
  }

  function getLocal(key) {
    return storage[key]
  }

  let user = storage['user'];
  $("#user-address").val(user)
  let airdrop = new web3.eth.Contract(abi.airdrop, contractAddress);
  let token = new web3.eth.Contract(abi.token, contractAddress);
  $("#airdrop").text(contractAddress)
  $("#lev").text(tokenAddress)

  $('#refresh').click(refreshUserInfo)
  refreshUserInfo();

  async function refreshUserInfo() {
    user = $("#user-address").val()
    storage['user'] = user
    if (!web3.utils.isAddress(user)) return alert('invalid address')
    let [balance, available, dropEnabled] = await Promise.all([
      token.methods.balanceOf(user).call(),
      airdrop.methods.balanceOf(user).call(),
      airdrop.methods.dropEnabled().call(),
    ])
    $("#token-balance").text((balance / 1e9).toFixed(9))
    $("#available-balance").text((available / 1e9).toFixed(9))
    $("#drop-enabled").text(dropEnabled ? 'Enabled' : 'Disabled')
  }


}

$(document).ready(function () {
  client().catch(console.error)
})