web3 = new Web3(new Web3.providers.HttpProvider(provider))

async function client() {
  let storage
  try {
    window.localStorage.test = 1
    storage                  = window.localStorage
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
  let token   = new web3.eth.Contract(abi.token, tokenAddress);
  $("#airdrop").html(contractAddress + "&nbsp;<a target='_blank' href='https://etherscan.io/address/" + contractAddress + "'><span class='glyphicon glyphicon-new-window'></span></a>")
  $("#lev").html(tokenAddress + "&nbsp;<a target='_blank' href='https://etherscan.io/address/" + tokenAddress + "'><span class='glyphicon glyphicon-new-window'></span></a>")
  $("#redeem-address").text(contractAddress)
  let tx = airdrop.methods.redeemTokens();
  $("#redeem-data").text(tx.encodeABI())
  $("#gas-price").text(web3.utils.fromWei(await web3.eth.getGasPrice(), "gwei") -0  + 1 + " GWEI")
  $('#refresh').click(refreshUserInfo)
  refreshUserInfo();

  async function refreshUserInfo() {
    user            = $("#user-address").val().trim()
    storage['user'] = user
    if (user && !web3.utils.isAddress(user)) {
      $("#my-modal").modal({show: true}).on('hidden.bs.modal', () => $("#user-address").focus())
    }
    let [available, dropEnabled, levWithContract] = await Promise.all([
      airdrop.methods.balanceOf(user).call(),
      airdrop.methods.dropEnabled().call(),
      token.methods.balanceOf(contractAddress).call(),
    ])
    // available = '2083294294495000'
    $("#token-status").hide()
    $("#redeem-instructions").show()
    $("#redeem-instructions-message").html('To redeem your tokens, simply send a transaction from the Ethereum address you registered with <i>(' + user + ')<i>')
    if ((available - 0) === 0) {
      $("#token-status").show().html('There are no tokens available to redeem for this address')
        .addClass('text-danger').removeClass('text-success')
      $("#redeem-instructions").hide()
    }

    $("#token-balance").text((levWithContract / 1e9).toFixed(9))
    let availableForBounty = (available / 1e9).toFixed(9);
    if ((available - levWithContract) >= 0 && dropEnabled) {
      $("#token-status").show().html('Insufficient tokens available in Airdrop contract to cover your allocation. Please contact us on <a href="https://t.me/Leverj" target="_blank">Telegram</a>')
        .addClass('text-danger').removeClass('text-success')
      $("#redeem-instructions").hide()
    }
    $("#available-balance").html(availableForBounty)
    $("#drop-status").html(dropEnabled ? 'Airdrop tokens are now available for redemption.' : '')

    if (!user) {
      $("#token-status").show().html('If you DID participate in the bounty program, please enter the Ethereum address that you registered for the airdrop with.')
        .removeClass('text-danger').addClass('text-success')
      $("#redeem-instructions").hide()
    }
    try {
      let gas = await tx.estimateGas({from:user});
      $("#gas-limit").text(gas)
    } catch (e) {
      console.error(e)
      $("#gas-limit").html("<code>" + e.message + "</code>")
    }
  }


}

$(document).ready(function () {
  client().catch(console.error)
})


