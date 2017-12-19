pragma solidity ^0.4.18;


import "./Owned.sol";
import "./Token.sol";


contract Leverjbounty is Owned {

  mapping (address => bool) public users;

  mapping (address => uint256) public social;

  uint256 public levPerUser;

  Token public token;

  bool public dropEnabled;

  event Redeemed(address user, uint tokens);

  modifier isDropEnabled{
    require(dropEnabled);
    _;
  }

  function Leverjbounty(address[] owners, address _token, uint256 _levPerUser) public {
    require(_token != address(0x0));
    require(_levPerUser > 0);
    setOwners(owners);
    token = Token(_token);
    levPerUser = _levPerUser;
  }

  function addUsers(address[] _users) onlyOwner public {
    require(_users.length > 0);
    for (uint i = 0; i < _users.length; i++) {
      users[_users[i]] = true;
    }
  }

  function addSocial(address[] _users, uint256[] _tokens) onlyOwner public {
    require(_users.length > 0 && _users.length == _tokens.length);
    for (uint i = 0; i < _users.length; i++) {
      social[_users[i]] = _tokens[i];
    }
  }

  function removeUsers(address[] _users) onlyOwner public {
    require(_users.length > 0);
    for (uint i = 0; i < _users.length; i++) {
      users[_users[i]] = false;
    }
  }

  function toggleDrop() onlyOwner public {
    dropEnabled = !dropEnabled;
  }

  function redeemTokens() isDropEnabled public {
    uint256 balance = balanceOf(msg.sender);
    require(balance > 0);
    users[msg.sender] = false;
    social[msg.sender] = 0;
    token.transfer(msg.sender, balance);
    Redeemed(msg.sender, balance);
  }

  function balanceOf(address user) public constant returns (uint256) {
    uint256 levs = social[user];
    if (users[user]) levs += levPerUser;
    return levs;
  }

  function transferTokens(address _address, uint256 _amount) onlyOwner public {
    token.transfer(_address, _amount);
  }
}
