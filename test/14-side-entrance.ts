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
let adminUser2: Signer; // should not be used
let optionsContract: Contract; // core contract
let usdc: Contract; // token contracts
let dai: Contract;
let uniFactory: Contract; // uniswap contracts
let uniRouter: Contract;
let usdcDaiPair: Contract;
let usdcEthPair: Contract;
let weth: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser, adminUser2] = accounts;

  // deploying token contracts:
  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
  await usdc.connect(admin).mintPerUser(
    [await admin.getAddress(), await adminUser.getAddress()],
    [precision.mul(2_000_000), precision.mul(100_000)]
  )

  let daiFactory = await ethers.getContractFactory('Token')
  dai = await daiFactory.connect(admin).deploy('DAI','DAI')
  await dai.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(1_000_000)]
  )

  // deploying uniswap contracts:
  let wethFactory = await ethers.getContractFactory('WETH9')
  weth = await wethFactory.connect(admin).deploy()
  await weth.connect(admin).deposit({value:precision.mul(500)})
  await weth.connect(adminUser2).deposit({value:precision.mul(50)})

  let uniFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode)
  uniFactory = await uniFactoryFactory.connect(admin).deploy(await admin.getAddress())

  let uniRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode)
  uniRouter = await uniRouterFactory.connect(admin).deploy(uniFactory.address,weth.address)

  // --adding initial liquidity
  await usdc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await dai.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await weth.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)

  await uniRouter.connect(admin).addLiquidity( // creates USDC-DAI pair
    usdc.address,dai.address,
    precision.mul(1_000_000),
    precision.mul(1_000_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  let pairAddress = await uniFactory.getPair(usdc.address,dai.address)
  let uniPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, admin)
  usdcDaiPair = uniPairFactory.attach(pairAddress)

  await uniRouter.connect(admin).addLiquidity( // creates USDC-ETH pair
    usdc.address,weth.address,
    precision.mul(1_000_000),
    precision.mul(500),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  pairAddress = await uniFactory.getPair(usdc.address,weth.address)
  usdcEthPair = uniPairFactory.attach(pairAddress)

  // deploying core contracts
  let optionsContractFactory = await ethers.getContractFactory('CallOptions')
  optionsContract = await optionsContractFactory.connect(admin).deploy(
    usdc.address,
    weth.address,
    usdcEthPair.address,
    uniFactory.address,
    uniRouter.address
  )

  // --initial interactions with core contracts
  await weth.connect(adminUser2).approve(optionsContract.address,ethers.constants.MaxUint256)
  let expiryTime = (await ethers.provider.getBlock('latest')).timestamp+(60*60*24*7) // one week
  await optionsContract.connect(adminUser2).createOption(
    precision.mul(1),
    precision.mul(2100),
    precision.mul(100),
    expiryTime
  )
  let createdOptionId = await optionsContract.connect(adminUser).getLatestOptionId()
  await usdc.connect(adminUser).approve(optionsContract.address,ethers.constants.MaxUint256)
  await optionsContract.connect(adminUser).purchaseOption(createdOptionId)

});

it("solves the challenge", async function () {

  // implement solution here

});

/// expected final state
after(async () => {

  // attacker steals at least 90k USDC
  expect(await usdc.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(90_000))

});