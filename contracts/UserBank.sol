// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;


contract UserBank {
    address public owner;

    struct User {
        string name;
        uint age;
        uint balance;
        uint[] deposits;
    }

    mapping(address => User) public users;

    modifier onlyOwner() {
        require(msg.sender == owner , "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(string memory _name, uint _age) public  {
        require(!isRegistered[msg.sender], "User already registered");
        users[msg.sender] = User(_name, _age, 0, new uint[](0));
    }

    function deposit(uint amount) public payable {
        users[msg.sender].balance += msg.value;
        users[msg.sender].deposits.push(msg.value);
    }

    function getBalance () public view returns (uint) {
        return users[msg.sender].balance;
    }

    function getDepositHistory () public view returns (uint[] memory) {
        return users[msg.sender].deposits;
    }

    function withdraw (uint _amount) public {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        users[msg.sender].balance -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    function getUser (address _user) public view returns (string memory, uint, uint) {
        User storage user = users[_user];
        return (user.name, user.age, user.balance);
    }
}

