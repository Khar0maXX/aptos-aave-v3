import { AptosProvider, ATokensClient, PoolClient, UnderlyingTokensClient, VariableTokensClient, consts } from "@aave/aave-v3-aptos-ts-sdk";
import chalk from "chalk";
import { aTokens, underlyingTokens, varTokens } from "../configs/config";
import { AccountAddress, MoveOption } from "@aptos-labs/ts-sdk";
import { rayToBps } from "../helpers/utils";
import {BigNumber} from "@ethersproject/bignumber";
import { rateStrategyStableTwo } from "../configs/pool";

export async function initReserves() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const poolManager = aptosProvider.getPoolProfileAccount();
  const poolClient = new PoolClient(aptosProvider, poolManager);
  const aTokensClient = new ATokensClient(aptosProvider, aptosProvider.getPoolProfileAccount());
  const varTokensClient = new VariableTokensClient(aptosProvider, aptosProvider.getPoolProfileAccount());
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, aptosProvider.getUnderlyingTokensProfileAccount());

  // create reserves input data
  const underlyingAssets = underlyingTokens.map((token) => token.accountAddress);
  const treasuries = underlyingTokens.map((token) => token.treasury);
  const aTokenNames = aTokens.map((token) => token.name);
  const aTokenSymbols = aTokens.map((token) => token.symbol);
  const varTokenNames = varTokens.map((token) => token.name);
  const varTokenSymbols = varTokens.map((token) => token.symbol);
  const incentiveControllers = underlyingTokens.map((_) => new MoveOption<AccountAddress>(consts.ZERO_ADDRESS));
  const optimalUsageRatio = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.optimalUsageRatio)).toBigInt());
  const baseVariableBorrowRate = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)).toBigInt());
  const variableRateSlope1 = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)).toBigInt());
  const variableRateSlope2 = underlyingTokens.map(item => rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)).toBigInt());

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
      chalk.yellow(
        `${varToken.symbol} var debt token account address: `,
        varTokenMetadataAddress.toString(),
      ),
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
