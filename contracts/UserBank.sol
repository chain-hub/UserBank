// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function register(string memory _name, uint _age) public {
        require(users[msg.sender].age == 0, "User already registered");
        users[msg.sender] = User({
            name: _name,
            age: _age,
            balance: 0,
            deposits: new uint[](0)
        });
    }
    
    function deposit() public payable {
        users[msg.sender].balance += msg.value;
        users[msg.sender].deposits.push(msg.value);
    }
    
    function getBalance() public view returns (uint) {
        return users[msg.sender].balance;
    }
    
    function getDepositHistory() public view returns (uint[] memory) {
        return users[msg.sender].deposits;
    }
    
    function withdraw(uint _amount) public {
        require(users[msg.sender].balance >= _amount, "Insufficient balance");
        users[msg.sender].balance -= _amount;
        payable(msg.sender).transfer(_amount);
    }
    
    function getUser(address _user) public view returns (string memory, uint, uint) {
        return (users[_user].name, users[_user].age, users[_user].balance);
    }
}

