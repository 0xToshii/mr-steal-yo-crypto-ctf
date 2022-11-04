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
let usdcAdmin: Signer; // should not be used
let usdc: Contract; // USDC contract
let safuVault: Contract;
let safuStrategy: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, usdcAdmin] = accounts;

  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(usdcAdmin).deploy('USDC','USDC')

  // attacker gets 10,000 USDC as starting funds
  await usdc.connect(usdcAdmin).mintPerUser(
    [await attacker.getAddress(), await admin.getAddress()],
    [precision.mul(10_000), precision.mul(10_000)]
  )

  let safuStrategyFactory = await ethers.getContractFactory('SafuStrategy')
  safuStrategy = await safuStrategyFactory.connect(admin).deploy(usdc.address)

  let safuVaultFactory = await ethers.getContractFactory('SafuVault')
  safuVault = await safuVaultFactory.connect(admin).deploy(safuStrategy.address,'LP Token','LP')
  
  await safuStrategy.connect(admin).setVault(safuVault.address)

  // other user deposits 10_000 USDC into the safu yield vault
  await usdc.connect(admin).approve(safuVault.address,ethers.constants.MaxUint256)
  await safuVault.connect(admin).depositAll()
  
});

it("solves the challenge", async function () {

  let safuExploiterFactory = await ethers.getContractFactory('SafuExploiter')
  let safuExploiter = await safuExploiterFactory.connect(attacker).deploy()

  usdc.connect(attacker).transfer(safuExploiter.address, precision.mul(10_000))
  await safuExploiter.connect(attacker).runExploit(usdc.address,safuVault.address)

});

/// expected final state
after(async () => {

  // attacker drains >= 90% of funds
  let totalVaultFunds = (await usdc.balanceOf(safuVault.address)) + (await usdc.balanceOf(safuStrategy.address))
  expect(totalVaultFunds).to.be.lte(precision.mul(1_000))
  expect(await usdc.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(19_000))
  
});
