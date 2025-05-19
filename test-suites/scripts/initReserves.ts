/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { PoolManager } from "../configs/pool";
import { AptosProvider } from "../wrappers/aptosProvider";
import { PoolClient } from "../clients/poolClient";
import { aTokens, underlyingTokens, varTokens } from "./createTokens";
import { ATokensClient } from "../clients/aTokensClient";
import { VariableTokensClient } from "../clients/variableTokensClient";
import chalk from "chalk";
import { UnderlyingManager } from "../configs/tokens";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import { ZERO_ADDRESS } from "../helpers/constants";
import {AccountAddress, MoveOption} from "@aptos-labs/ts-sdk";
import {BigNumber} from "@ethersproject/bignumber";
import {rateStrategyStableTwo} from "../configs/rates";
import {rayToBps} from "../helpers/common";

export async function initReserves() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const poolClient = new PoolClient(aptosProvider, PoolManager);
  const aTokensClient = new ATokensClient(aptosProvider);
  const varTokensClient = new VariableTokensClient(aptosProvider);
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);

  // create reserves input data
  const underlyingAssets = underlyingTokens.map((token) => token.accountAddress);
  const treasuries = underlyingTokens.map((token) => token.treasury);
  const aTokenNames = aTokens.map((token) => token.name);
  const aTokenSymbols = aTokens.map((token) => token.symbol);
  const varTokenNames = varTokens.map((token) => token.name);
  const varTokenSymbols = varTokens.map((token) => token.symbol);
  const incentiveControllers = underlyingTokens.map((_) => new MoveOption<AccountAddress>(AccountAddress.fromString(ZERO_ADDRESS)));
  const optimalUsageRatio = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.optimalUsageRatio)));
  const baseVariableBorrowRate = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)));
  const variableRateSlope1 = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)));
  const variableRateSlope2 = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)));

  // init reserves
  const txReceipt = await poolClient.initReserves(
    underlyingAssets,
    treasuries,
    aTokenNames,
    aTokenSymbols,
    varTokenNames,
    varTokenSymbols,
    incentiveControllers,
    optimalUsageRatio,
    baseVariableBorrowRate,
    variableRateSlope1,
    variableRateSlope2
  );
  console.log(chalk.yellow("Reserves set with tx hash", txReceipt.hash));

  // reserve atokens
  for (const [, aToken] of aTokens.entries()) {
    const aTokenMetadataAddress = await aTokensClient.getMetadataBySymbol(aToken.symbol);
    console.log(chalk.yellow(`${aToken.symbol} atoken metadata address: `, aTokenMetadataAddress.toString()));
    aToken.metadataAddress = aTokenMetadataAddress;

    const aTokenAddress = await aTokensClient.getTokenAddress(aToken.symbol);
    console.log(chalk.yellow(`${aToken.symbol} atoken account address: `, aTokenAddress.toString()));
    aToken.accountAddress = aTokenAddress;
  }

  // reserve var debt tokens
  for (const [, varToken] of varTokens.entries()) {
    const varTokenMetadataAddress = await varTokensClient.getMetadataBySymbol(
      varToken.symbol,
    );
    console.log(
      chalk.yellow(`${varToken.symbol} var debt token metadata address: `, varTokenMetadataAddress.toString()),
    );
    varToken.metadataAddress = varTokenMetadataAddress;

    const varTokenAddress = await varTokensClient.getTokenAddress(varToken.symbol);
    console.log(chalk.yellow(`${varToken.symbol} var debt token account address: `, varTokenAddress.toString()));
    varToken.accountAddress = varTokenAddress;
  }

  // get all pool reserves
  const allReserveUnderlyingTokens = await poolClient.getAllReservesTokens();

  // ==============================SET POOL RESERVES PARAMS===============================================
  // NOTE: all other params come from the pool reserve configurations
  for (const reserveUnderlyingToken of allReserveUnderlyingTokens) {
    const underlyingSymbol = await underlyingTokensClient.symbol(reserveUnderlyingToken.tokenAddress);
    // set reserve active
    let txReceipt = await poolClient.setReserveActive(reserveUnderlyingToken.tokenAddress, true);
    console.log(
      chalk.yellow(`Activated pool reserve ${underlyingSymbol.toUpperCase()}.
      Tx hash = ${txReceipt.hash}`),
    );
  }
}
