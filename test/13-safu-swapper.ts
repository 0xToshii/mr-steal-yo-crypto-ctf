// import { expect } from "chai";
// import { Contract, Signer, BigNumber } from "ethers";
// import { ethers } from "hardhat";

// const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
// const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
// const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

// const BN = BigNumber;
// let precision = BN.from(10).pow(18);

// let accounts: Signer[];
// let attacker: Signer;
// let o1: Signer;
// let o2: Signer;
// let admin: Signer; // should not be used
// let adminUser: Signer; // should not be used
// let safuUtils: Contract; // core contracts
// let safuPool: Contract;
// let usdc: Contract; // token contracts
// let dai: Contract;
// let safu: Contract;
// let uniFactory: Contract; // uniswap contracts
// let uniRouter: Contract;
// let uniPair: Contract; // DAI-USDC pool
// let weth: Contract;

// /// preliminary state
// before(async () => {

//   accounts = await ethers.getSigners();
//   [attacker, o1, o2, admin, adminUser] = accounts;

//   // deploying token contracts:
//   let usdcFactory = await ethers.getContractFactory('Token')
//   usdc = await usdcFactory.connect(admin).deploy('USDC','USDC')
//   await usdc.connect(admin).mintPerUser(
//     [await admin.getAddress(), await adminUser.getAddress()], 
//     [precision.mul(1_000_000), precision.mul(100_000)], 
//   )

//   let daiFactory = await ethers.getContractFactory('Token')
//   dai = await daiFactory.connect(admin).deploy('DAI','DAI')
//   await dai.connect(admin).mintPerUser(
//     [await admin.getAddress()],[precision.mul(1_000_000)]
//   )

//   let safuFactory = await ethers.getContractFactory('Token')
//   safu = await safuFactory.connect(admin).deploy('SAFU','SAFU')
//   await safu.connect(admin).mintPerUser(
//     [await adminUser.getAddress()],[precision.mul(200_000)]
//   )

//   // deploying uniswap contracts:
//   let wethFactory = await ethers.getContractFactory('WETH9')
//   weth = await wethFactory.connect(admin).deploy()

//   let uniFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode)
//   uniFactory = await uniFactoryFactory.connect(admin).deploy(await admin.getAddress())

//   let uniRouterFactory = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode)
//   uniRouter = await uniRouterFactory.connect(admin).deploy(uniFactory.address,weth.address)

//   // --adding initial liquidity for DAI
//   await usdc.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)
//   await dai.connect(admin).approve(uniRouter.address,ethers.constants.MaxUint256)

//   await uniRouter.connect(admin).addLiquidity( // creates pair
//     usdc.address,dai.address,
//     precision.mul(1_000_000),
//     precision.mul(1_000_000),
//     0,0,
//     await admin.getAddress(),
//     (await ethers.provider.getBlock('latest')).timestamp*2
//   )

//   let pairAddress = await uniFactory.getPair(usdc.address,dai.address)
//   let uniPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, admin)
//   uniPair = uniPairFactory.attach(pairAddress)

//   // initializing core contracts:
//   let safuUtilsFactory = await ethers.getContractFactory('SafuUtils')
//   safuUtils = await safuUtilsFactory.connect(admin).deploy()

//   let safuPoolFactory = await ethers.getContractFactory('SafuPool')
//   safuPool = await safuPoolFactory.connect(admin).deploy(safu.address,usdc.address,safuUtils.address)

//   // --adding initial liquidity to pool
//   await usdc.connect(adminUser).approve(safuPool.address,ethers.constants.MaxUint256)
//   await safu.connect(adminUser).approve(safuPool.address,ethers.constants.MaxUint256)
//   await safuPool.connect(adminUser).addLiquidity(precision.mul(200_000),precision.mul(100_000))

// });

// it("solves the challenge", async function () {

//   // implement solution here

// });

// /// expected final state
// after(async () => {

//   // attacker drains >= 90% of funds
//   expect(await usdc.balanceOf(await attacker.getAddress())).to.be.gte(precision.mul(90_000))
//   expect(await usdc.balanceOf(safuPool.address)).to.be.lte(precision.mul(10_000))

// });