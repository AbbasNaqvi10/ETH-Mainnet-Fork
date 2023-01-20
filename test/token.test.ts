const { ethers, network } = require("hardhat");
const hre = require("hardhat");
import { expect } from "chai";
import { Contract, ContractFactory, Signer, BigNumber, utils } from "ethers";
import {
  getBalancesETH,
  overwriteTokenAmount,
  returnSigner,
} from "../utils/helpers";
import RouterV2_ABI from "../config/ABI/RouterV2.json";
import { tokenSol } from "../typechain-types";

const wallet_addr =
  process.env.WALLET_ADDR === undefined ? "" : process.env["WALLET_ADDR"];
let walletSigner: Signer;
let deployerSigner: any;
let userSigner: any;
let uniswapV2Pair = "0x883d724bf960802ddd4c2c89d8682460cd19eb79";

let snapshotId: string;
let Token: any;
let wethContract: Contract;
let routerContract: any;

const ONE_ETH = utils.parseEther("1000");
const INITIAL_TOKEN_IN_CONTRACT = utils.parseEther("1000000000000000");
const ONE_GOOBBLE = utils.parseEther("100");
const TWO_GOOBBLE = utils.parseEther("200");
const minTokensBeforeSwap = utils.parseEther("10000000");
const ROUTER_ADD: string = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const WETH_ADD: string = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const MAX_UINT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

let txnAmt: string = "2500000000000000";

//Creating provider
const provider = new ethers.providers.getDefaultProvider(
  "http://127.0.0.1:8545/"
);

//Creating Router
routerContract = new ethers.Contract(ROUTER_ADD, RouterV2_ABI, provider);

describe("Token test on Uniswap router", async () => {
  // These reset the state after each test is executed
  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot");
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  before(async () => {
    //Demo accounts for testing
    [deployerSigner, userSigner] = await ethers.getSigners();

    // Impersonate the wallet signer and add credit
    await network.provider.send("hardhat_impersonateAccount", [wallet_addr]);
    console.log(`Impersonating account: ${wallet_addr}`);
    walletSigner = await returnSigner(wallet_addr);

    // load user wallet with initial amount
    await hre.network.provider.send("hardhat_setBalance", [
      await walletSigner.getAddress(),
      "0x10000000000000000000000",
    ]);

    const exchangeFactory = await ethers.getContractFactory("Token");
    Token = await exchangeFactory.connect(walletSigner).deploy();

    console.log(`Deployed Token at ${Token.address}`);

    wethContract = await ethers.getContractAt("ERC20", WETH_ADD, walletSigner);
    await overwriteTokenAmount(wethContract.address, wallet_addr, txnAmt, 51);

    await Token.connect(walletSigner).approve(ROUTER_ADD, MAX_UINT);

    await routerContract
      .connect(walletSigner)
      .addLiquidityETH(
        Token.address,
        ONE_ETH,
        0,
        0,
        Token.address,
        "100000000000000000",
        { value: utils.parseEther("10") }
      );
  });

  // it("Should Add liquidity", async () => {

  //   await Token.connect(walletSigner).approve(ROUTER_ADD, MAX_UINT);
  //   await routerContract
  //     .connect(walletSigner)
  //     .addLiquidityETH(
  //       Token.address,
  //       ONE_ETH,
  //       0,
  //       0,
  //       Token.address,
  //       "100000000000000000",
  //       {value:utils.parseEther('10')}
  //     );
  // });

  // it("Should Display Token name", async () => {
  //   expect(await Token.name()).to.equal("GOBBLE GOBBLE");
  // });

  // it("Should Display Token symbol", async () => {
  //   expect(await Token.symbol()).to.equal("GOBBLE");
  // });

  // it("Should Display Contract Balance", async () => {
  //   expect(await Token.balanceOf(deployerSigner.address)).to.equal(INITIAL_TOKEN_IN_CONTRACT);
  // });

  // it("Should Transfer 100 Token to User Account", async () => {
  //   await Token.transfer(userSigner.address, ONE_GOOBBLE);
  //   expect(await Token.balanceOf(userSigner.address)).to.equal(ONE_GOOBBLE);
  // });

  // it("Should Transfer 100 Token to uniswapV2 Pair", async () => {
  //   await Token.transfer(uniswapV2Pair, ONE_GOOBBLE);
  //   expect(await Token.balanceOf(uniswapV2Pair)).to.equal(ONE_GOOBBLE);
  // });

  // it("Should Transfer Token from Non-Taxless Account to uniswapV2 Pair", async () => {
  //   await Token.transfer(userSigner.address, TWO_GOOBBLE);
  //   await Token.connect(userSigner).approve(deployerSigner.address, ONE_GOOBBLE);
  //   await Token.transferFrom(userSigner.address, uniswapV2Pair, ONE_GOOBBLE);
  //   console.log("Balance of Recipient: ",await Token.balanceOf(uniswapV2Pair));
  //   //expect(await Token.balanceOf(uniswapV2Pair)).to.equal(ONE_GOOBBLE);
  // });

  // it("Should Swap and Liquify", async () => {
  //   await Token.transfer(Token.address, minTokensBeforeSwap);
  //   console.log("Balance of Recipient: ", await Token.balanceOf(Token.address));

  //   // console.log("Reserves: ",routerContract.factory().getReserves());
  //   await Token.transfer(uniswapV2Pair, ONE_GOOBBLE);
  //   //expect(await Token.balanceOf(uniswapV2Pair)).to.equal(ONE_GOOBBLE);
  // });

  // it("All Token of DeployerSigner transfer to Contract then add Liquidity", async () => {
  //   await Token.transfer(Token.address, Token.balanceOf(deployerSigner.address));
  //   console.log("Balance of Recipient: ", await Token.balanceOf(Token.address));
  //   await Token.connect(Token).approve(deployerSigner.address, ONE_GOOBBLE);
  //   await Token.transferFrom(Token.address,uniswapV2Pair, ONE_GOOBBLE);
  //   console.log("Balance of Contract: ", await Token.balanceOf(Token.address));
  //   console.log("Balance of Uniswap Pair: ", await Token.balanceOf(uniswapV2Pair));
  //   //expect(await Token.balanceOf(uniswapV2Pair)).to.equal(ONE_GOOBBLE);
  // });

  it("Should Remove Liquidity", async ()=> {
    await Token.showReserves();
    await routerContract.removeLiquidityETHSupportingFeeOnTransferTokens(Token.address, ONE_ETH, 0, 0, deployerSigner.address, "100000000000000000");
    await Token.showReserves();
  })

});
