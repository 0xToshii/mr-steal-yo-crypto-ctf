import { expect } from "chai";
import { Address } from "cluster";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";

const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let o1: Signer;
let o2: Signer;
let admin: Signer; // should not be used
let flatLaunchpeg: Contract; 
let startBlock: Number;
let jpegSniperExploiter: Contract;
let flatLaunchpegAddress: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin] = accounts;

  let flatLaunchpegFactory = await ethers.getContractFactory('FlatLaunchpeg')
  flatLaunchpeg = await flatLaunchpegFactory.connect(admin).deploy(69,5,5)
  await flatLaunchpeg.deployed()
  let flatLaunchpegAddress = await flatLaunchpeg.address
  console.log(flatLaunchpegAddress)

  startBlock = await ethers.provider.getBlockNumber()
  console.log(await startBlock);
  console.log(await flatLaunchpeg.connect(attacker).numberMinted(attacker.getAddress()))
  
});

it("solves the challenge", async function () {

  // implement solution here

 

  let jpegSniperExploiterFactory = await ethers.getContractFactory('jpegSniperExploiter')
  console.log(await attacker.getAddress())
  jpegSniperExploiter = await jpegSniperExploiterFactory.connect(attacker).deploy(flatLaunchpeg.address, attacker.getAddress())
  await jpegSniperExploiter.deployed()
  console.log(await jpegSniperExploiter.address);

//   jpegSniperExploiter.connect(attacker)._runExploit(flatLaunchpeg.address, attacker.getAddress())
//   console.log("success")
 console.log(await flatLaunchpeg.totalSupply()); 
 console.log(await flatLaunchpeg.connect(attacker).numberMinted(attacker.getAddress()))


});

/// expected final state
after(async () => {

  expect(await flatLaunchpeg.totalSupply()).to.be.equal(69)
  expect(await flatLaunchpeg.balanceOf(await attacker.getAddress())).to.be.equal(69)
  expect(await ethers.provider.getBlockNumber()).to.be.equal(startBlock+1)
  
});
