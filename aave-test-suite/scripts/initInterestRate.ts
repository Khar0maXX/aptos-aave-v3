import { BigNumber } from "@ethersproject/bignumber";
import { rateStrategyStableTwo } from "../configs/pool";
import chalk from "chalk";
import { AclClient, AptosProvider, PoolClient } from "@aave/aave-v3-aptos-ts-sdk";
import { underlyingTokens } from "../configs/config";
import { rayToBps } from "../helpers/utils";

export async function initDefaultInterestRates() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const poolClient = new PoolClient(
    aptosProvider,
    aptosProvider.getPoolProfileAccount(),
  );
  const aclClient = new AclClient(aptosProvider, aptosProvider.getAclProfileAccount());
  const PoolManager = aptosProvider.getPoolProfileAccount();
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
      rayToBps(BigNumber.from(rateStrategyStableTwo.optimalUsageRatio)).toBigInt(),
      rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)).toBigInt(),
      rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)).toBigInt(),
      rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)).toBigInt(),
    );
    console.log(
      chalk.yellow(
        `${underlyingToken.symbol} interest rate strategy set with tx hash`,
        txReceipt.hash,
      ),
    );
  }
}
