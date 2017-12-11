const expect = require('expect.js')
const affirm = require('affirm.js')
const Airdrop = artifacts.require('./Airdrop.sol');
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const total = 100000e9
const lib = require('./lib')
const totalUsers = 9
const each = Math.round(total / totalUsers)

contract('Add release blocks', function (accounts) {
  let token, airdrop;
  before(async function () {
    [token, airdrop] = await createContracts(accounts);
  })

  it('should be able to add release blocks ', async function () {
    let start = 50
    await airdrop.addReleaseBlocks(accounts, accounts.map(() => start++));
    start = 50
    for (let i = 0; i < accounts.length; i++) {
      let address = accounts[i];
      expect((await airdrop.releaseBlocks(address)).toNumber()).to.eql(start++);
    }
  })
})

contract('airdrop redeem', function (accounts) {
  let token, airdrop;
  before(async function () {
    let accountsForDrop = accounts.slice(0, totalUsers-1);
    [token, airdrop] = await createContracts(accountsForDrop);
    let start = 50
    await airdrop.addReleaseBlocks(accountsForDrop, accountsForDrop.map(() => start++));
  })

  it('user should not be able to redeem tokens before blocks', async function () {
    affirm(await lib.currentBlock() < await airdrop.releaseBlocks(accounts[2]));
    expect((await airdrop.getTokensAvailable({from: accounts[2]})).toNumber()).to.eql(0)
    try {
      await airdrop.redeemTokens({from: accounts[2]});
      expect().fail('should fail');
    } catch (e) {
      expect((await token.balanceOf(accounts[2])).toNumber()).to.eql(0);
    }
  })

  it('user should be able to redeem tokens after blocks', async function () {
    await lib.mineTo(70);
    affirm(await lib.currentBlock() > await airdrop.releaseBlocks(accounts[2]));
    expect((await airdrop.getTokensAvailable({from: accounts[2]})).toNumber()).to.eql(each)
    await airdrop.redeemTokens({from:accounts[2]})
    expect((await token.balanceOf(accounts[2])).toNumber()).to.eql(each);
  })

  it('user should not be able to redeem tokens twice', async function () {
    await lib.mineTo(70);
    affirm(await lib.currentBlock() > await airdrop.releaseBlocks(accounts[3]));
    await airdrop.redeemTokens({from:accounts[3]})
    try {
      await airdrop.redeemTokens({from: accounts[3]})
      expect().fail('should have failed')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode')
    }
    expect((await token.balanceOf(accounts[3])).toNumber()).to.eql(each);
  })
  it('should not allow any user to redeem tokens who is not part of releaseBlocks', async function(){
    await lib.mineTo(70);
    affirm(await lib.currentBlock() > await airdrop.releaseBlocks(accounts[8]));
    expect((await airdrop.getTokensAvailable({from: accounts[9]})).toNumber()).to.eql(0)
    try{
      await airdrop.redeemTokens({from:accounts[9]})
      expect().fail('should have failed')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode')
    }
    expect((await token.balanceOf(accounts[9])).toNumber()).to.eql(0);
  })

})


async function createContracts(accounts) {
  let token = await HumanStandardToken.new(total, "LEV", 9, "LEV");
  let airdrop = await Airdrop.new([accounts[0]], token.address, each);
  await token.transfer(airdrop.address, total);
  return [token, airdrop];
}