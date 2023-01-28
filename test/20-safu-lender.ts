import { expect } from "chai";
import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";

const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const ERC1820_PAYLOAD = require("../contracts/other/ERC1820.json")['payload']
const ERC1820_DEPLOYER = require("../contracts/other/ERC1820.json")['deployer']

const BN = BigNumber;
let precision = BN.from(10).pow(18);

let accounts: Signer[];
let attacker: Signer;
let o1: Signer;
let o2: Signer;
let admin: Signer; // should not be used
let adminUser: Signer; // should not be used
let moneyMarket: Contract; // core contracts
let usdc: Contract; // token contracts
let wbtc: Contract;
let uniFactory: Contract; // uniswap contracts
let uniRouter: Contract;
let weth: Contract;
let usdcBtcPair: Contract;

/// preliminary state
before(async () => {

  accounts = await ethers.getSigners();
  [attacker, o1, o2, admin, adminUser] = accounts;

  // deploying ERC1820Registry contract at 0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
  await ethers.provider.send('eth_sendTransaction', [{
    from: await admin.getAddress(),
    to: ERC1820_DEPLOYER,
    value: '0x11c37937e080000'
  }])

  await ethers.provider.send('eth_sendRawTransaction', [ERC1820_PAYLOAD])

  // deploying token contracts
  let usdcFactory = await ethers.getContractFactory('Token')
  usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
  await usdc.connect(admin).mintPerUser(
    [await admin.getAddress()],[precision.mul(2_000_000)]
  )

  let wbtcFactory = await ethers.getContractFactory('Token777')
  wbtc = await wbtcFactory.connect(admin).deploy('wBTC','wBTC',[])
  await wbtc.connect(admin).mintPerUser(
    [await admin.getAddress(), await adminUser.getAddress()],
    [precision.mul(2_000), precision.mul(1_000)]
  )

  // deploying uniwap contracts
  let wethFactory = await ethers.getContractFactory('WETH9')
  weth = await wethFactory.connect(admin).deploy()

  let uniFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode)
  uniFactory = await uniFactoryFactory.connect(admin).deploy(await admin.getAddress())

  let uniRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode)
  uniRouter = await uniRouterFactory.connect(admin).deploy(uniFactory.address,weth.address)

  // --adding initial liquidity
  await usdc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
  await wbtc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)

  await uniRouter.connect(admin).addLiquidity( // creates USDC-wBTC pair
    usdc.address,wbtc.address,
    precision.mul(2_000_000),
    precision.mul(2_000),
    0,0,
    await admin.getAddress(),
    (await ethers.provider.getBlock('latest')).timestamp*2
  )

  let pairAddress = await uniFactory.getPair(usdc.address,wbtc.address)
  let uniPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, admin)
  usdcBtcPair = uniPairFactory.attach(pairAddress)

  // deploying core contracts
  let moneyMarketFactory = await ethers.getContractFactory('MoneyMarket')
  moneyMarket = await moneyMarketFactory.connect(admin).deploy()

  await moneyMarket.connect(admin)._supportMarket(wbtc.address)
    
  await wbtc.connect(adminUser).approve(moneyMarket.address,ethers.constants.MaxUint256)
  await moneyMarket.connect(adminUser).supply(wbtc.address,precision.mul(1_000))

});

it("solves the challenge", async function () {

  // implement solution here

});

/// expected final state
after(async () => {

  // attacker drains at least 99% of the wBTC from MoneyMarket
  expect(await wbtc.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(990))
  expect(await wbtc.balanceOf(moneyMarket.address)).to.be.lte(precision.mul(10))

});