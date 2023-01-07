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
let adminUser2,adminUser3,adminUser4,adminUser5: Signer; // should not be used
let adminUserAddresses = [];
let optionsContract: Contract;
let optionsMarket: Contract;
let usdc: Contract;
let attackerStart;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser, adminUser2, adminUser3, adminUser4, adminUser5] = accounts;

  let adminUserAccounts = [adminUser, adminUser2, adminUser3, adminUser4, adminUser5]
  for (let i=0; i<adminUserAccounts.length; i++) {
    adminUserAddresses.push(await adminUserAccounts[i].getAddress())
  }

  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
  await usdc.connect(admin).mintPerUser(
    adminUserAddresses, Array(5).fill(precision.mul(2_000)) // strike price
  )
  await usdc.connect(admin).mintPerUser(
    [await attacker.getAddress()], [precision.mul(500)] // attacker starts with 500 USDC
  )

  // deploying core contracts
  let optionsMarketFactory = await ethers.getContractFactory('OptionsMarket')
  optionsMarket = await optionsMarketFactory.connect(admin).deploy(usdc.address)

  let optionsContractFactory = await ethers.getContractFactory('OptionsContract')
  optionsContract = await optionsContractFactory.connect(admin).deploy(
    usdc.address,
    2_000, // strike price of 2000 USDC per ETH
    (await ethers.provider.getBlock('latest')).timestamp+(60*60), // 1hr expiry
    optionsMarket.address
  )

  await optionsMarket.connect(admin).setPrice(100) // 100 USDC premium per oToken
  await optionsMarket.connect(admin).setOptionsContract(optionsContract.address)

  // -- adminUser(s) purchase 1 option each
  for (let i=0; i<adminUserAccounts.length; i++) {
    await usdc.connect(adminUserAccounts[i]).approve(optionsContract.address,precision.mul(2_000))
    await optionsContract.connect(adminUserAccounts[i]).createAndSellERC20CollateralOption(precision.mul(2_000))
  }

  // getting starting attacker balance
  attackerStart = await ethers.provider.getBalance(await attacker.getAddress())

});

it("solves the challenge", async function () {

  // implement solution here

});

/// expected final state
after(async () => {

  // attacker acquires all USDC from options contract - doesn't use more than 1 ETH + gas
  expect(await usdc.balanceOf(optionsContract.address)).to.be.equal(0)
  expect(await usdc.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(10_000))
  expect(await ethers.provider.getBalance(await attacker.getAddress())).to.be.gte(attackerStart.sub(precision.mul(11).div(10)))

});