const expect = require('expect.js')
const affirm = require('affirm.js')
const Airdrop = artifacts.require('./Leverjbounty.sol');
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const total = 100000e9
const lib = require('./lib')
const totalUsers = 9
const each = Math.round(total / totalUsers)
const MONTH = 30 * 24 * 3600;
let current, freeze, expiry

//IMPORTANT:
// this contract has time dependency
// after increasing time, it is not posible to reduce time for next contract block
// therefore all the tests are in a single contract and all "it" are dependent on each other.


contract('Airdrop', function (accounts) {
  let token, airdrop;
  before(async function () {
    [token, airdrop] = await createContracts(accounts);
  })

  it('should allow to add users before freeze time', async function () {
    affirm(await lib.getCurrentTime() < freeze);
    await airdrop.addUsers(accounts);
    for (let i = 0; i < accounts.length; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
  })

  it('should allow to add social bounty information before freeze time', async function () {
    affirm(await lib.getCurrentTime() < freeze);
    await airdrop.addSocial([accounts[5], accounts[6]], [1e9, 2e9]);
    expect((await airdrop.social(accounts[5])).toNumber()).to.eql(1e9);
    expect((await airdrop.social(accounts[6])).toNumber()).to.eql(2e9);
  })

  it('should allow to remove users before freeze time', async function () {
    affirm(await lib.getCurrentTime() < freeze);
    await airdrop.removeUsers([accounts[8], accounts[9]]);

    for (let i = 0; i < 8; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
    expect(await airdrop.users(accounts[8])).to.eql(false);
    expect(await airdrop.users(accounts[9])).to.eql(false);
  })

  it('should not allow toggle drop before freeze', async function () {
    affirm(await lib.getCurrentTime() < freeze);
    affirm(!(await airdrop.dropEnabled()))
    try {
      await airdrop.toggleDrop()
      expect().fail('should fail')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await airdrop.dropEnabled()).to.eql(false);
  })

  it('should allow admin to change freeze time if it has not frozen', async function () {
    affirm(await lib.getCurrentTime() < freeze);
    freeze += MONTH
    expiry += MONTH
    await airdrop.changeDuration(freeze, expiry);
    expect((await airdrop.freeze()).toNumber()).to.eql(freeze)
    expect((await airdrop.expiry()).toNumber()).to.eql(expiry)
  })

  it('should not allow to add users after freeze time', async function () {
    await lib.forceTime(2 * MONTH + 10)
    await lib.getCurrentTime();
    affirm(await lib.getCurrentTime() > freeze);
    try {
      await airdrop.addUsers([accounts[8], accounts[9]]);
      expect().fail('should fail')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    for (let i = 0; i < 8; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
    expect(await airdrop.users(accounts[8])).to.eql(false);
    expect(await airdrop.users(accounts[9])).to.eql(false);
  })

  it('should not allow to add social bounty information after freeze time', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    try {
      await airdrop.addSocial([accounts[8]], [1e9]);
      expect().fail('should fail')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect((await airdrop.social(accounts[8])).toNumber()).to.eql(0);
  })

  it('should not allow admin to change freeze time if it has frozen', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    let newFreeze = freeze + MONTH
    let newExpiry = expiry + MONTH
    try {
      await airdrop.changeDuration(newFreeze, newExpiry);
      expect().fail('should fail')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect((await airdrop.freeze()).toNumber()).to.eql(freeze)
    expect((await airdrop.expiry()).toNumber()).to.eql(expiry)
  })

  it('should not allow to remove users after freeze time', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    try {
      await airdrop.removeUsers([accounts[1], accounts[2]]);
      expect().fail('should fail')
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    for (let i = 0; i < 8; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
    expect(await airdrop.users(accounts[8])).to.eql(false);
    expect(await airdrop.users(accounts[9])).to.eql(false);
  })

  it('should not allow users to redeem tokens when redeem is haulted', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(!await airdrop.dropEnabled())
    try {
      await airdrop.redeemTokens({from: accounts[2]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[2])).to.eql(0);
  })

  it('should allow toggle drop after freeze only', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(!await airdrop.dropEnabled())
    await airdrop.toggleDrop()
    expect(await airdrop.dropEnabled()).to.eql(true);
  })

  it('should allow users to redeem tokens when redeem is not haulted', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(await airdrop.dropEnabled())
    await airdrop.redeemTokens({from: accounts[2]});
    expect(await balanceOf(token, accounts[2])).to.eql(each);
  })

  it('should allow users to redeem social and awareness tokens when redeem is not haulted', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(await airdrop.dropEnabled())
    await airdrop.redeemTokens({from: accounts[5]});
    expect(await balanceOf(token, accounts[5])).to.eql(each + 1e9);
  })

  it('should not allow users to redeem tokens twice', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(await airdrop.dropEnabled())
    await airdrop.redeemTokens({from: accounts[3]});
    expect(await balanceOf(token, accounts[3])).to.eql(each);
    try {
      await airdrop.redeemTokens({from: accounts[3]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[3])).to.eql(each);
  })

  it('should not allow any unlisted user to redeem tokens', async function () {
    affirm(await lib.getCurrentTime() > freeze);
    affirm(await airdrop.dropEnabled())
    expect((await airdrop.getTokensAvailable(accounts[9])).toNumber()).to.eql(0);
    try {
      await airdrop.redeemTokens({from: accounts[9]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[9])).to.eql(0);
  })
  it('should not allow admin to transfer all unclaimed tokes before expiry', async function () {
    affirm(await lib.getCurrentTime() < expiry);
    let tokensWithContract = await balanceOf(token, airdrop.address);
    affirm(tokensWithContract > 0);
    try {
      await airdrop.transferUnclaimedTokens(accounts[0]);
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, airdrop.address)).to.eql(tokensWithContract);
  })

  it('should allow admin to transfer all unclaimed tokes after expiry', async function () {
    await lib.forceTime(MONTH);
    affirm(await lib.getCurrentTime() > expiry);
    let tokensWithContract = await balanceOf(token, airdrop.address);
    affirm(tokensWithContract > 0);
    await airdrop.transferUnclaimedTokens(accounts[0]);
    expect(await balanceOf(token, airdrop.address)).to.eql(0);
    expect(await balanceOf(token, accounts[0])).to.eql(tokensWithContract);
  })
})

async function createContracts(accounts) {
  current = await lib.getCurrentTime()
  let token = await HumanStandardToken.new(total, "LEV", 9, "LEV");
  freeze = current + MONTH
  expiry = freeze + MONTH
  let airdrop = await Airdrop.new([accounts[0]], token.address, each, freeze, expiry);
  await token.transfer(airdrop.address, total);
  return [token, airdrop];
}

async function balanceOf(token, address) {
  return (await token.balanceOf(address)).toNumber()
}

