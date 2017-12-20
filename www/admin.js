async function client() {
  web3 = new Web3(web3.currentProvider)
  let user = (await web3.eth.getAccounts())[0];
  $("#current-user").text(user)
  $("#airdrop").text(contractAddress)
  let airdrop = new web3.eth.Contract(abi.airdrop, contractAddress);
  $("#add-user").click(addUser)
  $("#remove-user").click(removeUser)
  $("#toggle-drop").click(toggleDrop)
  $("#redeem-tokens").click(redeemTokens)
  $("#reclaim-tokens").click(transferUnclaimedTokens)
  $("#add-social").click(addSocial)

  async function addSocial() {
    let address = $("#social-user").val()
    let amount = ($("#social-amount").val() - 0) * 1e9
    await sendTx(airdrop.methods.addSocial([address], [amount]))
  }

  async function addUser() {
    let user = $("#user").val()
    await sendTx(airdrop.methods.addUsers([user]))
  }

  async function removeUser() {
    let user = $("#user").val()
    await sendTx(airdrop.methods.removeUsers([user]))
  }

  async function toggleDrop() {
    await sendTx(airdrop.methods.toggleDrop())
  }

  async function redeemTokens() {
    await sendTx(airdrop.methods.redeemTokens())
  }

  async function transferUnclaimedTokens() {
    let amount = $("#amount").val() - 0
    await sendTx(airdrop.methods.transferTokens(user, amount))
  }

  async function sendTx(tx) {
    let gasPrice = Math.max((await web3.eth.getGasPrice()) - 0, 21e9);
    airdrop.options.from = user;
    let gas = await tx.estimateGas();
    console.log('gas', gas, gasPrice);
    return await tx.send({from: user, gas, gasPrice})
  }

  async function getDate(prop) {
    let time = await airdrop.methods[prop]().call()
    return new Date(time * 1000)
  }

  function time(plus) {
    let current = Math.round(Date.now() / 1000)
    return current + plus * 60
  }


}

$(document).ready(function () {
  client().catch(console.error)
})