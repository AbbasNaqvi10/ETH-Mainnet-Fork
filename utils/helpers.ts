const hre = require("hardhat");
const { ethers, network } = require("hardhat");
import { Signer, Contract, BigNumber } from "ethers";

export async function returnSigner(address: string): Promise<Signer> {
  await network.provider.send("hardhat_impersonateAccount", [address]);
  return ethers.provider.getSigner(address);
}

export async function overwriteTokenAmount(
  assetAddr: string,
  walletAddr: string,
  amount: string,
  slot: number = 0
) {
  const index = ethers.utils.solidityKeccak256(
    ["uint256", "uint256"],
    [walletAddr, slot]
  );
  const BN = ethers.BigNumber.from(amount)._hex.toString();
  const number = ethers.utils.hexZeroPad(BN, 32);

  await ethers.provider.send("hardhat_setStorageAt", [
    assetAddr,
    index,
    number,
  ]);
  await hre.network.provider.send("evm_mine");
}

export async function increaseTime(sec: number) {
    await hre.network.provider.send("evm_increaseTime", [sec]);
    await hre.network.provider.send("evm_mine");
}

export async function increaseBlock(block: number) {
    //console.log(`⌛ Advancing ${block} blocks`);
    for (let i = 1; i <= block; i++) {
        await hre.network.provider.send("evm_mine");
    }
}

export async function fastForwardAWeek() {
    //console.log(`⌛ Fast Forwarding 3600 blocks within a week`);
    let i = 0;
    do {
        await increaseTime(60 * 60 * 24);
        await increaseBlock(60 * 60);
        i++;
    } while (i < 8);
}

export async function getBalancesETH(walletSigner: Signer) {
    const user = Number(ethers.utils.formatEther(await walletSigner.getBalance()));

    return user; 
}