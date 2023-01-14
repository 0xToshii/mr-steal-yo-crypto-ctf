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
let gov: Contract; // token
let revest: Contract; // core contracts
let lockManager: Contract;
let tokenVault: Contract;
let fnftHandler: Contract;
let addressRegistry: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying token contracts
  let govFactory = await ethers.getContractFactory('Token')
  gov = await govFactory.connect(admin).deploy('GOV','GOV')
  await gov.connect(admin).mintPerUser(
    [await adminUser.getAddress(), await attacker.getAddress()], 
    [precision.mul(100_000), precision.mul(1)]
  )

  // deploying core contracts
  let addressRegistryFactory = await ethers.getContractFactory('AddressRegistry')
  addressRegistry = await addressRegistryFactory.connect(admin).deploy()

  let revestFactory = await ethers.getContractFactory('Revest')
  revest = await revestFactory.connect(admin).deploy(addressRegistry.address)

  let lockManagerFactory = await ethers.getContractFactory('LockManager')
  lockManager = await lockManagerFactory.connect(admin).deploy(addressRegistry.address)

  let tokenVaultFactory = await ethers.getContractFactory('TokenVault')
  tokenVault = await tokenVaultFactory.connect(admin).deploy(addressRegistry.address)

  let fnftHandlerFactory = await ethers.getContractFactory('FNFTHandler')
  fnftHandler = await fnftHandlerFactory.connect(admin).deploy(addressRegistry.address)

  await addressRegistry.connect(admin).setLockManager(lockManager.address)
  await addressRegistry.connect(admin).setTokenVault(tokenVault.address)
  await addressRegistry.connect(admin).setRevestFNFT(fnftHandler.address)
  await addressRegistry.connect(admin).setRevest(revest.address)

  // --adminUser deposits GOV token into Revest vault
  await gov.connect(adminUser).approve(revest.address,precision.mul(100_000))
  await revest.connect(adminUser).mintAddressLock(
    await adminUser.getAddress(),
    ethers.constants.HashZero,
    [await adminUser.getAddress()],
    [100],
    {asset:gov.address,depositAmount:precision.mul(1_000),depositMul:0}
  )

});

it("solves the challenge", async function () {

  // implement solution here

});

/// expected final state
after(async () => {

  // attacker acquires all GOV tokens that were deposited into the Revest contract
  expect(await gov.balanceOf(tokenVault.address)).to.be.equal(0)
  expect(await gov.balanceOf(await attacker.getAddress())).to.be.equal(precision.mul(100_001))

});