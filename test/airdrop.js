const expect = require('expect.js')
const affirm = require('affirm.js')
const Airdrop = artifacts.require('./Leverjbounty.sol');
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const total = 100000e9
const totalUsers = 9
const each = Math.round(total / totalUsers)

contract('add users', function (accounts) {
  let token, airdrop;
  before(async function () {
    [token, airdrop] = await createContracts(accounts);
  })
  it('should allow to add users', async function () {
    await airdrop.addUsers(accounts);
    for (let i = 0; i < accounts.length; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
  })

  it('should allow to add social bounty information', async function () {
    await airdrop.addSocial([accounts[5], accounts[6]], [1e9, 2e9]);
    expect((await airdrop.social(accounts[5])).toNumber()).to.eql(1e9);
    expect((await airdrop.social(accounts[6])).toNumber()).to.eql(2e9);
  })

  it('should allow to remove users', async function () {
    await airdrop.addUsers(accounts);
    await airdrop.removeUsers([accounts[8], accounts[9]]);
    for (let i = 0; i < 8; i++) {
      expect(await airdrop.users(accounts[i])).to.eql(true);
    }
    expect(await airdrop.users(accounts[8])).to.eql(false);
    expect(await airdrop.users(accounts[9])).to.eql(false);
  })
})

contract('redeem tokens', function (accounts) {
  let token, airdrop;
  before(async function () {
    [token, airdrop] = await createContracts(accounts);
    await airdrop.addUsers(accounts);
  })
  it('should not allow users to redeem tokens when redeem is haulted', async function () {
    await disableToggle(airdrop)
    try {
      await airdrop.redeemTokens({from: accounts[2]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[2])).to.eql(0);
  })

  it('should allow users to redeem tokens when redeem is not haulted', async function () {
    await enableToggle(airdrop)
    await airdrop.redeemTokens({from: accounts[2]});
    expect(await balanceOf(token, accounts[2])).to.eql(each);
  })

  it('should not allow users to redeem tokens twice', async function () {
    await enableToggle(airdrop)
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
})

contract('social bounty', function (accounts) {
  let token, airdrop;
  before(async function () {
    [token, airdrop] = await createContracts(accounts);
    await airdrop.addUsers(accounts);
    await airdrop.addSocial([accounts[5], accounts[6]], [1e9, 2e9]);
  })

  it('should allow users to redeem social and awareness tokens when redeem is not haulted', async function () {
    await enableToggle(airdrop)
    await airdrop.redeemTokens({from: accounts[5]});
    expect(await balanceOf(token, accounts[5])).to.eql(each + 1e9);
  })


  it('should not allow users to redeem social tokens twice', async function () {
    affirm(await airdrop.dropEnabled())
    await airdrop.redeemTokens({from: accounts[6]});
    expect(await balanceOf(token, accounts[6])).to.eql(each + 2e9);
    try {
      await airdrop.redeemTokens({from: accounts[6]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[6])).to.eql(each + 2e9);
  })

  it('should not allow any unlisted user to redeem tokens', async function () {
    affirm(await airdrop.dropEnabled())
    await airdrop.removeUsers([accounts[9]]);
    expect((await airdrop.balanceOf(accounts[9])).toNumber()).to.eql(0);
    try {
      await airdrop.redeemTokens({from: accounts[9]});
      expect().fail('should fail');
    } catch (e) {
      expect(e.message).to.eql('VM Exception while processing transaction: invalid opcode');
    }
    expect(await balanceOf(token, accounts[9])).to.eql(0);
  })

  it('should allow admin to transfer tokens', async function () {
    let tokensWithContract = await balanceOf(token, airdrop.address);
    affirm(tokensWithContract > 0);
    await airdrop.transferTokens(accounts[0], tokensWithContract);
    expect(await balanceOf(token, airdrop.address)).to.eql(0);
    expect(await balanceOf(token, accounts[0])).to.eql(tokensWithContract);
  })
})

async function createContracts(accounts) {
  let token = await HumanStandardToken.new(total, "LEV", 9, "LEV");
  let airdrop = await Airdrop.new([accounts[0]], token.address, each);
  await token.transfer(airdrop.address, total);
  return [token, airdrop];
}

async function balanceOf(token, address) {
  return (await token.balanceOf(address)).toNumber()
}

async function disableToggle(airdrop) {
  if (await airdrop.dropEnabled()) await airdrop.toggleDrop()
  affirm(!await airdrop.dropEnabled())
}

async function enableToggle(airdrop) {
  if (!await airdrop.dropEnabled()) await airdrop.toggleDrop()
  affirm(await airdrop.dropEnabled())
}
