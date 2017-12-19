web3 = new Web3(new Web3.providers.HttpProvider(provider))

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
  let token = new web3.eth.Contract(abi.token, tokenAddress);
  $("#airdrop").text(contractAddress)
  $("#lev").text(tokenAddress)
  $("#redeem-address").text(contractAddress)
  $("#redeem-data").text(airdrop.methods.redeemTokens().encodeABI())
  $('#refresh').click(refreshUserInfo)
  refreshUserInfo();

  async function refreshUserInfo() {
    user = $("#user-address").val()
    storage['user'] = user
    if (!web3.utils.isAddress(user)) {
      $("#my-modal").modal({show: true}).on('hidden.bs.modal', () => $("#user-address").focus())
    }
    let [balance, available, dropEnabled] = await Promise.all([
      token.methods.balanceOf(user).call(),
      airdrop.methods.balanceOf(user).call(),
      airdrop.methods.dropEnabled().call(),
    ])
    $("#token-balance").text((balance / 1e9).toFixed(9))
    $("#available-balance").text((available / 1e9).toFixed(9))
    $("#drop-enabled").html(dropEnabled ? 'Enabled - LEV tokens can be redeemed.' : 'Disabled - LEV tokens <code>CAN NOT</code> be redeemed now. ' +
      '<br> Stay tuned at <a href="https://t.me/joinchat/C-gLzkMqKr1zmoeS-ZQePg" target="_blank">leverj chat <span class="glyphicon glyphicon-share" </a>')
  }


}

$(document).ready(function () {
  client().catch(console.error)
})