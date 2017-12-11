pragma solidity ^0.4.18;


import "./Owned.sol";
import "./Token.sol";


contract Airdrop is Owned {

  mapping (address => uint256) public releaseBlocks;

  mapping (address => bool) public redeemed;

  uint public levPerUser;

  Token public token;

  function Airdrop(address[] owners, Token _token, uint _levPerUser) public {
    require(_token != address(0x0));
    require(_levPerUser > 0);
    setOwners(owners);
    token = _token;
    levPerUser = _levPerUser;
  }

  function addReleaseBlocks(address[] users, uint256[] blocks) onlyOwner public {
    require(users.length > 0 && users.length == blocks.length);
    for (uint i = 0; i < users.length; i++) {
      releaseBlocks[users[i]] = blocks[i];
    }
  }

  function redeemTokens() public {
    uint256 tokensAvailable = getTokensAvailable();
    require(tokensAvailable > 0);
    redeemed[msg.sender] = true;
    token.transfer(msg.sender, tokensAvailable);
  }

  function getTokensAvailable() public constant returns(uint256) {
    if (block.number >= releaseBlocks[msg.sender] && releaseBlocks[msg.sender] > 0 && !redeemed[msg.sender]) {
      return levPerUser;
    } else {
      return 0;
    }
  }
}
