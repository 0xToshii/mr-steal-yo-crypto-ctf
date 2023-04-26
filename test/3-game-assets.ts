// import { expect } from "chai";
// import { Contract, Signer, BigNumber } from "ethers";
// import { ethers } from "hardhat";

// const BN = BigNumber;
// let precision = BN.from(10).pow(18);

// let accounts: Signer[];
// let attacker: Signer;
// let o1: Signer;
// let o2: Signer;
// let admin: Signer; // should not be used
// let adminUser: Signer; // should not be used
// let assetWrapper: Contract;
// let swordAsset: Contract;
// let shieldAsset: Contract;

// /// preliminary state
// before(async () => {

//   accounts = await ethers.getSigners();
//   [attacker, o1, o2, admin, adminUser] = accounts;

//   let assetWrapperFactory = await ethers.getContractFactory('AssetWrapper')
//   assetWrapper = await assetWrapperFactory.connect(admin).deploy("")

//   let swordAssetFactory = await ethers.getContractFactory('GameAsset')
//   swordAsset = await swordAssetFactory.connect(admin).deploy('SWORD','SWORD')

//   let shieldAssetFactory = await ethers.getContractFactory('GameAsset')
//   shieldAsset = await shieldAssetFactory.connect(admin).deploy('SHIELD','SHIELD')

//   // whitelist the two assets for use in the game
//   await assetWrapper.connect(admin).updateWhitelist(swordAsset.address)
//   await assetWrapper.connect(admin).updateWhitelist(shieldAsset.address)

//   // set the operator of the two game assets to be the wrapper contract
//   await swordAsset.connect(admin).setOperator(assetWrapper.address)
//   await shieldAsset.connect(admin).setOperator(assetWrapper.address)

//   // adminUser is the user you will be griefing
//   // minting 1 SWORD & 1 SHIELD asset for adminUser
//   await swordAsset.connect(admin).mintForUser(await adminUser.getAddress(),1)
//   await shieldAsset.connect(admin).mintForUser(await adminUser.getAddress(),1)
  
//   expect(await swordAsset.balanceOf(await adminUser.getAddress())).to.be.equal(1)
//   expect(await shieldAsset.balanceOf(await adminUser.getAddress())).to.be.equal(1)

// });

// it("solves the challenge", async function () {

//   // implement solution here

// });

// /// expected final state
// after(async () => {

//   // attacker traps user's SWORD and SHIELD NFTs inside assetWrapper contract
//   expect(await swordAsset.balanceOf(await adminUser.getAddress())).to.be.equal(0)
//   expect(await shieldAsset.balanceOf(await adminUser.getAddress())).to.be.equal(0)

//   expect(await swordAsset.balanceOf(assetWrapper.address)).to.be.equal(1)
//   expect(await shieldAsset.balanceOf(assetWrapper.address)).to.be.equal(1)

//   expect(await assetWrapper.balanceOf(await adminUser.getAddress(),0)).to.be.equal(0)
//   expect(await assetWrapper.balanceOf(await adminUser.getAddress(),1)).to.be.equal(0)

// });
