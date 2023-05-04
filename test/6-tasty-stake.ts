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
// let steak: Contract; // staking token
// let butter: Contract; // farm token
// let tastyStaking: Contract;

// /// preliminary state
// before(async () => {

//   accounts = await ethers.getSigners();
//   [attacker, o1, o2, admin, adminUser] = accounts;

//   let steakFactory = await ethers.getContractFactory('Token') // staking token
//   steak = await steakFactory.connect(admin).deploy('STEAK','STEAK')

//   await steak.connect(admin).mintPerUser( // attacker gets 1 steak
//     [await adminUser.getAddress(), await attacker.getAddress()],
//     [precision.mul(100_000), precision.mul(1)]
//   )

//   let butterFactory = await ethers.getContractFactory('Token') // reward token
//   butter = await butterFactory.connect(admin).deploy('BUTTER','BUTTER')

//   await butter.connect(admin).mintPerUser(
//     [await admin.getAddress()],
//     [precision.mul(10_000)]
//   )

//   let tastyStakingFactory = await ethers.getContractFactory('TastyStaking')
//   tastyStaking = await tastyStakingFactory.connect(admin).deploy(steak.address,await admin.getAddress())

//   // setting up the rewards for tastyStaking
//   await tastyStaking.connect(admin).addReward(butter.address)
//   await butter.connect(admin).approve(tastyStaking.address,precision.mul(10_000))
//   await tastyStaking.connect(admin).notifyRewardAmount(butter.address,precision.mul(10_000))

//   // other user stakes initial amount of steak
//   await steak.connect(adminUser).approve(tastyStaking.address,ethers.constants.MaxUint256)
//   await tastyStaking.connect(adminUser).stakeAll()

//   // advance time by an hour
//   await ethers.provider.send("evm_increaseTime", [3600])
//   await ethers.provider.send("evm_mine")

// });

// it("solves the challenge", async function () {

//   // implement solution here

// });

// /// expected final state
// after(async () => {

//   // attacker drains all staking tokens from tastyStaking contract
//   expect(await steak.balanceOf(tastyStaking.address)).to.be.equal(0)
//   expect(await steak.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(100_000))

// });