/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { BigNumber } from "@ethersproject/bignumber";
import { PoolManager, rateStrategyStableTwo } from "../configs/rates";
import { AptosProvider } from "../wrappers/aptosProvider";
import { underlyingTokens } from "./createTokens";
import { AclManager } from "../configs/aclManage";
import chalk from "chalk";
import { AclClient } from "../clients/aclClient";
import {PoolClient} from "../clients/poolClient";
import {rayToBps} from "../helpers/common";

export async function initDefaultInterestRates() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const poolClient = new PoolClient(aptosProvider, PoolManager);
  const aclClient = new AclClient(aptosProvider, AclManager);
  const isRiskAdmin = await aclClient.isRiskAdmin(PoolManager.accountAddress);
  if (!isRiskAdmin) {
    console.log(`Setting ${PoolManager.accountAddress.toString()} to be asset risk and pool admin`);
    await aclClient.addRiskAdmin(PoolManager.accountAddress);
    await aclClient.addPoolAdmin(PoolManager.accountAddress);
  }
  console.log(`${PoolManager.accountAddress.toString()} set to be risk and pool admin`);

  // set interest rate strategy for each reserve
  for (const [, underlyingToken] of underlyingTokens.entries()) {
    const txReceipt = await poolClient.updateInterestRateStrategy(
      underlyingToken.accountAddress,
      rayToBps(BigNumber.from(rateStrategyStableTwo.optimalUsageRatio)),
      rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)),
      rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)),
      rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)),
    );
    console.log(chalk.yellow(`${underlyingToken.symbol} interest rate strategy set with tx hash`, txReceipt.hash));
  }
}
