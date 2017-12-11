const expect = require('expect.js')
const Airdrop = artifacts.require('./Airdrop.sol');
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
const total = 100000e9
const lib = require('./lib')

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
    [token, airdrop] = await createContracts(accounts);
    await airdrop.addUserBlocks(accounts, accounts.map(() => each));
  })

  it('user should be able to redeem tokens', async function () {
    // air
  })
})


async function createContracts(accounts) {
  let each = Math.round(total / accounts.length)
  let token = await HumanStandardToken.new(total, "LEV", 9, "LEV");
  let airdrop = await Airdrop.new([accounts[0]], token.address, each);
  await token.transfer(airdrop.address, total);
  return [token, airdrop];
}