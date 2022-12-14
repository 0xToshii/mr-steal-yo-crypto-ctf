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
let admin2: Signer; // should not be used
let safuWallet: Contract;
let safuWalletLibrary: Contract;
let functionInput;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, admin2] = accounts;

  let safuWalletLibraryFactory = await ethers.getContractFactory('SafuWalletLibrary')
  safuWalletLibrary = await safuWalletLibraryFactory.connect(admin).deploy()

  let safuWalletFactory = await ethers.getContractFactory('SafuWallet')
  safuWallet = await safuWalletFactory.connect(admin).deploy(
    [await admin2.getAddress()], // msg.sender is automatically considered an owner
    2, // both admins required to execute transactions
    ethers.constants.MaxUint256 // max daily limit
  )

  // admin deposits 100 ETH to the wallet
  await admin.sendTransaction({to:safuWallet.address, value:precision.mul(100)})

  // admin withdraws 50 ETH from the wallet
  let iface = new ethers.utils.Interface([
    "function execute(address _to, uint256 _value, bytes _data)"
  ])

  functionInput = iface.encodeFunctionData("execute", [
    await admin.getAddress(),
    precision.mul(50),
    "0x"
  ])

  await admin.sendTransaction({to:safuWallet.address, data:functionInput})

  expect(await ethers.provider.getBalance(safuWallet.address)).to.be.equal(precision.mul(100-50))

});

it("solves the challenge", async function () {

  // implement solution here

});

/// expected final state
after(async () => {

  // admin attempting to withdraw final 50 ETH - should revert
  await expect(admin.sendTransaction({to:safuWallet.address, data:functionInput})).to.be.reverted

});