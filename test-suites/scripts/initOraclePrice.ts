/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { OracleManager } from "../configs/oracle";
import { AptosProvider } from "../wrappers/aptosProvider";
import { OracleClient } from "../clients/oracleClient";
import { underlyingTokens, aTokens, varTokens } from "./createTokens";
import chalk from "chalk";
import { AclClient } from "../clients/aclClient";
import { AclManager } from "../configs/aclManage";
import { AccountAddress, CommittedTransactionResponse } from "@aptos-labs/ts-sdk";
import { priceFeeds } from "../helpers/priceFeeds";
import { UnderlyingManager } from "../configs/tokens";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import { BigNumber } from "@ethersproject/bignumber";

export async function initReserveOraclePrice() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const oracleClient = new OracleClient(aptosProvider, OracleManager);
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);
  const aclClient = new AclClient(aptosProvider, AclManager);
  const isAssetListingAdmin = await aclClient.isAssetListingAdmin(OracleManager.accountAddress);
  let txReceipt: CommittedTransactionResponse;
  if (!isAssetListingAdmin) {
    console.log(`Setting ${OracleManager.accountAddress.toString()} to be asset listing and and pool admin`);
    txReceipt = await aclClient.addAssetListingAdmin(OracleManager.accountAddress);
    txReceipt = await aclClient.addPoolAdmin(OracleManager.accountAddress);
  }
  console.log(`${OracleManager.accountAddress.toString()} set to be asset listing and pool admin`);

  // set underlying prices and feed ids
  for (const [, underlyingToken] of underlyingTokens.entries()) {
    const priceFeed = priceFeeds.get(underlyingToken.symbol);
    const underlyingToBorrow = await underlyingTokensClient.getTokenAddress(underlyingToken.symbol);
    let txReceipt = await oracleClient.setAssetCustomPrice(underlyingToBorrow, BigNumber.from("1"));
    console.log(
      chalk.yellow(
        `Feed Id ${priceFeed} set by oracle for underlying asset ${underlyingToken.symbol} with address ${underlyingToBorrow.toString()} and price of 1.0. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set atoken price feeds
  for (const [, aToken] of aTokens.entries()) {
    const priceFeed = priceFeeds.get(aToken.underlyingSymbol);
    const txReceipt = await oracleClient.setAssetCustomPrice(aToken.accountAddress, BigNumber.from("1"));
    console.log(
      chalk.yellow(
        `Feed Id ${priceFeed} set by oracle for atoken ${aToken.symbol} with address ${aToken.accountAddress.toString()}. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set var token price feeds
  for (const [, varToken] of varTokens.entries()) {
    const priceFeed = priceFeeds.get(varToken.underlyingSymbol);
    const txReceipt = await oracleClient.setAssetCustomPrice(varToken.accountAddress, BigNumber.from("1"));
    console.log(
      chalk.yellow(
        `Feed Id ${priceFeed} set by oracle for vartoken ${varToken.symbol} with address ${varToken.accountAddress.toString()}. Tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // set the mapped aptos token price feed
  const priceFeed = priceFeeds.get("APT");
  const mappedAptCoin = AccountAddress.fromString("0xa");
  txReceipt = await oracleClient.setAssetCustomPrice(mappedAptCoin, BigNumber.from("1"));
  chalk.yellow(
    `Feed Id ${priceFeed} set by oracle for mapped coin APT with address ${mappedAptCoin.toString()}. Tx hash = ${txReceipt.hash}`,
  );
}
