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
        User storage user = users[msg.sender];
        require(user.age > 0, "User not registered");

        user.balance += msg.value;
        user.deposits.push(msg.value);
    }

    function getBalance() public view returns (uint) {
        return users[msg.sender].balance;
    }

    function getDepositHistory() public view returns (uint[] memory) {
        return users[msg.sender].deposits;
    }

    function withdraw(uint _amount) public {
        User storage user = users[msg.sender];
        require(user.age > 0, "User not registered");
        require(user.balance >= _amount, "Insufficient balance");
        user.balance -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    function getUser(address _user) public view onlyOwner 
        returns (string memory name, uint age, uint balance)
    {
        User memory user = users[_user];
        return (user.name, user.age, user.balance);
    }
}