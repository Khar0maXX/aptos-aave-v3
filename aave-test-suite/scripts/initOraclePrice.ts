import chalk from "chalk";
import { AccountAddress, CommittedTransactionResponse } from "@aptos-labs/ts-sdk";
import { AclClient, AptosProvider, OracleClient, UnderlyingTokensClient } from "@aave/aave-v3-aptos-ts-sdk";
import { aTokens, underlyingTokens, varTokens } from "../configs/config";

export async function initReserveOraclePrice() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const oracleClient = new OracleClient(aptosProvider, aptosProvider.getOracleProfileAccount());
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, aptosProvider.getUnderlyingTokensProfileAccount());
  const aclClient = new AclClient(aptosProvider, aptosProvider.getAclProfileAccount());
  const oracleManager = aptosProvider.getOracleProfileAccount();
  const isAssetListingAdmin = await aclClient.isAssetListingAdmin(oracleManager.accountAddress);
  let txReceipt: CommittedTransactionResponse;
  if (!isAssetListingAdmin) {
    console.log(`Setting ${oracleManager.accountAddress.toString()} to be asset listing and and pool admin`);
    txReceipt = await aclClient.addAssetListingAdmin(oracleManager.accountAddress);
    txReceipt = await aclClient.addPoolAdmin(oracleManager.accountAddress);
  }
  console.log(`${oracleManager.accountAddress.toString()} set to be asset listing and pool admin`);

  // set underlying prices and feed ids
  for (const [, underlyingToken] of underlyingTokens.entries()) {
    const underlyingToBorrow = await underlyingTokensClient.tokenAddress(underlyingToken.symbol);
    let txReceipt = await oracleClient.setAssetCustomPrice(underlyingToBorrow, 1n);
    console.log(
      chalk.yellow(
        `Oracle set for underlying asset ${underlyingToken.symbol} with address ${underlyingToBorrow.toString()} and price of 1.0. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set atoken price feeds
  for (const [, aToken] of aTokens.entries()) {
    const txReceipt = await oracleClient.setAssetCustomPrice(aToken.accountAddress, 1n);
    console.log(
      chalk.yellow(
        `Oracle set for atoken ${aToken.symbol} with address ${aToken.accountAddress.toString()}. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set var token price feeds
  for (const [, varToken] of varTokens.entries()) {
    const txReceipt = await oracleClient.setAssetCustomPrice(varToken.accountAddress, 1n);
    console.log(
      chalk.yellow(
        `Oracle set for vartoken ${varToken.symbol} with address ${varToken.accountAddress.toString()}. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set the mapped aptos token price feed
  const mappedAptCoin = AccountAddress.fromString("0xa");
  txReceipt = await oracleClient.setAssetCustomPrice(mappedAptCoin, 1n);
  chalk.yellow(
    `Oracle set by oracle for mapped coin APT with address ${mappedAptCoin.toString()}. Tx hash = ${txReceipt.hash}`,
  );
}
