pragma solidity ^0.4.18;


import "./Owned.sol";
import "./Token.sol";


contract Leverjbounty is Owned {

  mapping (address => bool) public users;

  uint256 public levPerUser;

  Token public token;

  uint public freeze;

  uint public expiry;

  bool public dropEnabled;

  event Redeemed(address user, uint tokens);

  modifier expired{
    require(expiry < now);
    _;
  }

  modifier notFrozen{
    require(freeze > now);
    _;
  }

  modifier isDropEnabled{
    require(dropEnabled);
    _;
  }

  function Leverjbounty(address[] owners, address _token, uint256 _levPerUser, uint _freeze, uint _expiry) public {
    require(_token != address(0x0));
    require(_levPerUser > 0);
    require(_freeze < _expiry && _freeze > now);
    setOwners(owners);
    token = Token(_token);
    levPerUser = _levPerUser;
    freeze = _freeze;
    expiry = _expiry;
  }

  function changeDuration(uint _freeze, uint _expiry) onlyOwner notFrozen public {
    require(_freeze < _expiry && _freeze > now);
    freeze = _freeze;
    expiry = _expiry;
  }

  function addUsers(address[] _users) onlyOwner notFrozen public {
    require(_users.length > 0);
    for (uint i = 0; i < _users.length; i++) {
      users[_users[i]] = true;
    }
  }

  function removeUsers(address[] _users) onlyOwner notFrozen public {
    require(_users.length > 0);
    for (uint i = 0; i < _users.length; i++) {
      users[_users[i]] = false;
    }
  }

  function toggleDrop() onlyOwner public {
    require(now > freeze);
    dropEnabled = !dropEnabled;
  }

  function redeemTokens() public {
    uint256 tokensAvailable = getTokensAvailable(msg.sender);
    require(tokensAvailable > 0);
    users[msg.sender] = false;
    token.transfer(msg.sender, tokensAvailable);
    Redeemed(msg.sender, tokensAvailable);
  }

  function getTokensAvailable(address user) public constant returns (uint256) {
    if (users[user] && dropEnabled) {
      return levPerUser;
    }
    else {
      return 0;
    }
  }

  function transferUnclaimedTokens(address _address) onlyOwner expired public {
    uint256 balance = token.balanceOf(this);
    token.transfer(_address, balance);
  }
}
