import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";

const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let o1: Signer;
let o2: Signer;
let admin: Signer; // should not be used
let adminUser: Signer; // should not be used
let govToken: Contract;
let rewardsAdvisor: Contract;
let farm: Contract; // farm token
let scam: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying `FARM` token contract
  let farmTokenFactory = await ethers.getContractFactory('Token')
  farm = await farmTokenFactory.connect(admin).deploy('FARM','FARM')

  await farm.connect(admin).mintPerUser( // attacker gets 1
    [await adminUser.getAddress(), await attacker.getAddress()],
    [precision.mul(10_000), precision.mul(1)]
  )

  // deploying protocol contracts
  let govTokenFactory = await ethers.getContractFactory('GovToken')
  govToken = await govTokenFactory.connect(admin).deploy("xFARM","xFARM")

  let rewardsAdvisorFactory = await ethers.getContractFactory('RewardsAdvisor')
  rewardsAdvisor = await rewardsAdvisorFactory.connect(admin).deploy(farm.address,govToken.address)

  await govToken.connect(admin).transferOwnership(rewardsAdvisor.address)

  // other user stakes their `FARM` token
  let adminUserAddress = await adminUser.getAddress()
  await farm.connect(adminUser).approve(rewardsAdvisor.address,ethers.constants.MaxUint256)
  await rewardsAdvisor.connect(adminUser).deposit(precision.mul(10_000),adminUserAddress,adminUserAddress)

});

it("solves the challenge", async function () {

  // implement solution here

  let scamFactory = await ethers.getContractFactory('Scam')
  scam = await scamFactory.connect(attacker).deploy(rewardsAdvisor.address)

  // await scam.connect(attacker).owner(scam)

  await scam.steal()


});

/// expected final state
after(async () => {

  // attacker drains 99.99%+ of the `FARM` tokens from RewardsAdvisor staking contract
  expect(await farm.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(10_000))
  expect(await farm.balanceOf(rewardsAdvisor.address)).to.be.lte(precision.mul(1))

});