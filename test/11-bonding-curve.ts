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
let eminenceCurrencyBase: Contract; // core contracts
let eminenceCurrency: Contract;
let usdc: Contract; // token contracts
let dai: Contract;
let uniFactory: Contract; // uniswap contracts
let uniRouter: Contract;
let uniPair: Contract; // DAI-USDC pool
let weth: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying token contracts:
  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
  await usdc.connect(admin).mintPerUser(
    [await admin.getAddress()], [precision.mul(1_000_000)]
  )

  let daiFactory = await ethers.getContractFactory('Token')
  dai = await daiFactory.connect(admin).deploy('DAI','DAI')
  await dai.connect(admin).mintPerUser(
    [await admin.getAddress(), await adminUser.getAddress()],
    [precision.mul(1_000_000), precision.mul(200_000)]
  )

  // deploying uniswap contracts:
  let wethFactory = await ethers.getContractFactory('WETH9')
  weth = await wethFactory.connect(admin).deploy()

  let uniFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode)
  uniFactory = await uniFactoryFactory.connect(admin).deploy(await admin.getAddress())

  let uniRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode)
  uniRouter = await uniRouterFactory.connect(admin).deploy(uniFactory.address,weth.address)

  // --adding initial liquidity for DAI
  await usdc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await dai.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)

  await uniRouter.connect(admin).addLiquidity( // creates pair
    usdc.address,
    dai.address,
    precision.mul(1_000_000),
    precision.mul(1_000_000),
    0,
    0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  let pairAddress = await uniFactory.getPair(usdc.address,dai.address)
  let uniPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, admin)
  uniPair = uniPairFactory.attach(pairAddress)
  // console.log(await uniPair.token1()) // dai

  // setting up core contracts:
  let bancorBondingCurveFactory = await ethers.getContractFactory('BancorBondingCurve')
  let bancorBondingCurve = await bancorBondingCurveFactory.connect(admin).deploy()
  // console.log(bancorBondingCurve.address) // hardcoded in ContinuousToken

  // --base DAI <-> EMN bonding curve
  let eminenceCurrencyBaseFactory = await ethers.getContractFactory('EminenceCurrencyBase') 
  eminenceCurrencyBase = await eminenceCurrencyBaseFactory.connect(admin).deploy(
    "Eminence","EMN",999000,dai.address
  )

  // --secondary EMN <-> TOKEN bonding curve
  let eminenceCurrencyFactory  = await ethers.getContractFactory('EminenceCurrency')
  eminenceCurrency = await eminenceCurrencyFactory.connect(admin).deploy(
    "eTOKEN","TOKEN",500000,eminenceCurrencyBase.address
  )

  // interacting with core contracts:
  await dai.connect(adminUser).approve(eminenceCurrencyBase.address,ethers.constants.MaxUint256)
  await eminenceCurrencyBase.connect(adminUser).approve(eminenceCurrency.address,ethers.constants.MaxUint256)

  // --swap all DAI to EMN, convert 1/2 EMN to TOKEN
  await eminenceCurrencyBase.connect(adminUser).buy(precision.mul(200_000),0)
  let receivedEmn = await eminenceCurrencyBase.balanceOf(await adminUser.getAddress())
  await eminenceCurrency.connect(adminUser).buy(receivedEmn.div(2),0)

});

it("solves the challenge", async function () {

  let exploiterFactory = await ethers.getContractFactory('BondingExploiter')
  let exploiter = await exploiterFactory.connect(admin).deploy()

  await exploiter.connect(attacker).runExploit(
    uniPair.address,
    eminenceCurrencyBase.address,
    eminenceCurrency.address,
    precision.mul(900_000)
  )

});

/// expected final state
after(async () => {

  // attacker steals at least 50k in DAI
  expect(await dai.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(50_000));

});