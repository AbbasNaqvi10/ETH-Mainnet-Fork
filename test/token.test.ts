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

const wallet_addr =
  process.env.WALLET_ADDR === undefined ? "" : process.env["WALLET_ADDR"];
let walletSigner: Signer;

let snapshotId: string;
let Token: Contract;
let wethContract: Contract;
let routerContract: Contract;

const ONE_ETH = utils.parseEther("1000");
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
routerContract = new ethers.Contract(ROUTER_ADD,RouterV2_ABI,provider);


describe("Token test on Uniswap router", async () => {
  // These reset the state after each test is executed
  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot");
  });
  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  before(async () => {
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


  });

  it("Should Add liquidity", async () => {
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
        {value:utils.parseEther('10')}
      );
  });
});
