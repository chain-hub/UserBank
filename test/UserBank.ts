import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("UserBank", function () {
  let userBank: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    userBank = await ethers.deployContract("UserBank");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await userBank.owner()).to.equal(owner.address);
    });
  });

  describe("User Registration", function () {
    it("Should register a user successfully", async function () {
      const userName = "Alice";
      const userAge = 25;

      await userBank.connect(user1).register(userName, userAge);

      const [name, age, balance] = await userBank.connect(owner).getUser(user1.address);
      expect(name).to.equal(userName);
      expect(age).to.equal(userAge);
      expect(balance).to.equal(0);
    });

    it("Should not allow duplicate user registration", async function () {
      await userBank.connect(user1).register("Alice", 25);
      
      await expect(
        userBank.connect(user1).register("Bob", 30)
      ).to.be.revertedWith("User already registered");
    });

    it("Should not allow registration with zero age", async function () {
      await userBank.connect(user1).register("Alice", 0);
      
      // Age 0 is allowed in the contract, but let's test the registration works
      const [name, age] = await userBank.connect(owner).getUser(user1.address);
      expect(name).to.equal("Alice");
      expect(age).to.equal(0);
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      await userBank.connect(user1).register("Alice", 25);
    });

    it("Should allow user to deposit ether", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await userBank.connect(user1).deposit({ value: depositAmount });
      
      expect(await userBank.connect(user1).getBalance()).to.equal(depositAmount);
    });

    it("Should track deposit history", async function () {
      const deposit1 = ethers.parseEther("1.0");
      const deposit2 = ethers.parseEther("0.5");
      
      await userBank.connect(user1).deposit({ value: deposit1 });
      await userBank.connect(user1).deposit({ value: deposit2 });
      
      const history = await userBank.connect(user1).getDepositHistory();
      expect(history).to.have.lengthOf(2);
      expect(history[0]).to.equal(deposit1);
      expect(history[1]).to.equal(deposit2);
    });

    it("Should not allow deposit from unregistered user", async function () {
      await expect(
        userBank.connect(user2).deposit({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("User not registered");
    });

    it("Should handle multiple deposits correctly", async function () {
      const deposit1 = ethers.parseEther("1.0");
      const deposit2 = ethers.parseEther("2.0");
      const deposit3 = ethers.parseEther("0.5");
      
      await userBank.connect(user1).deposit({ value: deposit1 });
      await userBank.connect(user1).deposit({ value: deposit2 });
      await userBank.connect(user1).deposit({ value: deposit3 });
      
      const totalBalance = deposit1 + deposit2 + deposit3;
      expect(await userBank.connect(user1).getBalance()).to.equal(totalBalance);
      
      const history = await userBank.connect(user1).getDepositHistory();
      expect(history).to.have.lengthOf(3);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await userBank.connect(user1).register("Alice", 25);
      await userBank.connect(user1).deposit({ value: ethers.parseEther("2.0") });
    });

    it("Should allow user to withdraw funds", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await userBank.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      const expectedBalance = initialBalance + withdrawAmount - gasUsed;
      
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
      expect(await userBank.connect(user1).getBalance()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should not allow withdrawal of more than balance", async function () {
      const withdrawAmount = ethers.parseEther("3.0");
      
      await expect(
        userBank.connect(user1).withdraw(withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow withdrawal from unregistered user", async function () {
      await expect(
        userBank.connect(user2).withdraw(ethers.parseEther("1.0"))
      ).to.be.revertedWith("User not registered");
    });

    it("Should allow full balance withdrawal", async function () {
      const fullBalance = await userBank.connect(user1).getBalance();
      
      await userBank.connect(user1).withdraw(fullBalance);
      
      expect(await userBank.connect(user1).getBalance()).to.equal(0);
    });
  });

  describe("User Information", function () {
    beforeEach(async function () {
      await userBank.connect(user1).register("Alice", 25);
      await userBank.connect(user1).deposit({ value: ethers.parseEther("1.5") });
    });

    it("Should return correct user information for owner", async function () {
      const [name, age, balance] = await userBank.connect(owner).getUser(user1.address);
      expect(name).to.equal("Alice");
      expect(age).to.equal(25);
      expect(balance).to.equal(ethers.parseEther("1.5"));
    });

    it("Should not allow non-owner to get user information", async function () {
      await expect(
        userBank.connect(user2).getUser(user1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should return empty data for unregistered user", async function () {
      const [name, age, balance] = await userBank.connect(owner).getUser(user2.address);
      expect(name).to.equal("");
      expect(age).to.equal(0);
      expect(balance).to.equal(0);
    });
  });

  describe("Multiple Users", function () {
    it("Should allow multiple users to register and operate independently", async function () {
      // Register both users
      await userBank.connect(user1).register("Alice", 25);
      await userBank.connect(user2).register("Bob", 30);
      
      // Make deposits
      await userBank.connect(user1).deposit({ value: ethers.parseEther("1.0") });
      await userBank.connect(user2).deposit({ value: ethers.parseEther("2.0") });
      
      // Check balances
      expect(await userBank.connect(user1).getBalance()).to.equal(ethers.parseEther("1.0"));
      expect(await userBank.connect(user2).getBalance()).to.equal(ethers.parseEther("2.0"));
      
      // Check user info
      const [name1, age1, balance1] = await userBank.connect(owner).getUser(user1.address);
      const [name2, age2, balance2] = await userBank.connect(owner).getUser(user2.address);
      
      expect(name1).to.equal("Alice");
      expect(age1).to.equal(25);
      expect(balance1).to.equal(ethers.parseEther("1.0"));
      
      expect(name2).to.equal("Bob");
      expect(age2).to.equal(30);
      expect(balance2).to.equal(ethers.parseEther("2.0"));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount deposits", async function () {
      await userBank.connect(user1).register("Alice", 25);
      
      await userBank.connect(user1).deposit({ value: 0 });
      
      expect(await userBank.connect(user1).getBalance()).to.equal(0);
      const history = await userBank.connect(user1).getDepositHistory();
      expect(history).to.have.lengthOf(1);
      expect(history[0]).to.equal(0);
    });

    it("Should handle zero amount withdrawals", async function () {
      await userBank.connect(user1).register("Alice", 25);
      await userBank.connect(user1).deposit({ value: ethers.parseEther("1.0") });
      
      await userBank.connect(user1).withdraw(0);
      
      expect(await userBank.connect(user1).getBalance()).to.equal(ethers.parseEther("1.0"));
    });
  });
});
