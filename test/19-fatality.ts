import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";

const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let o1: Signer;
let o2: Signer;
let admin: Signer; // should not be used
let adminUser: Signer; // should not be used
let vault: Contract; // core contracts
let bunnyMinter: Contract;
let zapBSC: Contract;
let usdc: Contract; // token contracts
let dai: Contract;
let bunny: Contract;
let bnb: Contract;
let uniFactory: Contract; // uniswap contracts
let uniRouter: Contract;
let weth: Contract;
let usdcBnbPair: Contract;
let bnbBunnyPair: Contract;
let startBlock: Number;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying token contracts:
  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
  await usdc.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(1_900_000)]
  )

  let daiFactory = await ethers.getContractFactory('Token')
  dai = await daiFactory.connect(admin).deploy('DAI','DAI')
  await dai.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(1_900_000)]
  )

  let bunnyFactory = await ethers.getContractFactory('Token')
  bunny = await bunnyFactory.connect(admin).deploy('BUNNY','BUNNY')
  await bunny.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(9_000)]
  )

  let bnbFactory = await ethers.getContractFactory('Token')
  bnb = await bnbFactory.connect(admin).deploy('BNB','BNB')
  await bnb.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(9_000)]
  )

  // deploying uniswap contracts:
  let wethFactory = await ethers.getContractFactory('WETH9')
  weth = await wethFactory.connect(admin).deploy()

  let uniFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode)
  uniFactory = await uniFactoryFactory.connect(admin).deploy(await admin.getAddress())

  let uniRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode)
  uniRouter = await uniRouterFactory.connect(admin).deploy(uniFactory.address,weth.address)

  // --adding initial liquidity
  await usdc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await dai.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await bunny.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await bnb.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)

  await uniRouter.connect(admin).addLiquidity( // creates USDC-DAI pair
    usdc.address,dai.address,
    precision.mul(1_000_000),
    precision.mul(1_000_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  await uniRouter.connect(admin).addLiquidity( // creates USDC-BNB pair
    usdc.address,bnb.address,
    precision.mul(900_000),
    precision.mul(3_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  await uniRouter.connect(admin).addLiquidity( // creates DAI-BNB pair
    dai.address,bnb.address,
    precision.mul(900_000),
    precision.mul(3_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  await uniRouter.connect(admin).addLiquidity( // creates BUNNY-BNB pair
    bunny.address,bnb.address,
    precision.mul(9_000), // 3x bunny per 1x bnb
    precision.mul(3_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  let pairAddress = await uniFactory.getPair(usdc.address,bnb.address)
  let uniPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, admin)
  usdcBnbPair = uniPairFactory.attach(pairAddress)

  pairAddress = await uniFactory.getPair(bnb.address,bunny.address)
  bnbBunnyPair = uniPairFactory.attach(pairAddress)

  // deploying core contracts
  let zapBSCFactory = await ethers.getContractFactory('ZapBSC')
  zapBSC = await zapBSCFactory.connect(admin).deploy(
    uniRouter.address,bnb.address,usdc.address,bunny.address
  )

  let bunnyMinterFactory = await ethers.getContractFactory('BunnyMinter')
  bunnyMinter = await bunnyMinterFactory.connect(admin).deploy(
    zapBSC.address,uniRouter.address,bnb.address,bunny.address,
    await uniFactory.getPair(bnb.address,bunny.address)
  )

  let vaultFactory = await ethers.getContractFactory('AutoCompoundVault')
  vault = await vaultFactory.connect(admin).deploy(
    await uniFactory.getPair(bnb.address,usdc.address),bunnyMinter.address
  )

  // --required updates to contract state
  await zapBSC.connect(admin).setMinter(bunnyMinter.address)
  await bunnyMinter.connect(admin).setMinter(vault.address)
  await bunny.connect(admin).transferOwnership(bunnyMinter.address) // bunnyMinter given mint rights

  startBlock = await ethers.provider.getBlockNumber()

});

it("solves the challenge", async function () {
  
  // implement solution here

});

/// expected final state
after(async () => {

  // attacker steals at least 1100 BNB - only allowed 2 blocks to run exploit
  expect(await bnb.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(1_100))
  expect(await ethers.provider.getBlockNumber()).to.be.lte(startBlock+2)

});