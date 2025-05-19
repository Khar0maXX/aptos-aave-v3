/* eslint-disable no-console */
import { PoolManager, strategyAAVE, strategyDAI, strategyLINK, strategyUSDC, strategyWBTC, strategyWETH } from "../configs/pool";
import { AAVE, DAI, LINK, USDC, WBTC, WETH } from "../configs/tokens";
import { underlyingTokens } from "./createTokens";
import { PoolClient } from "../clients/poolClient";
import { AptosProvider } from "../wrappers/aptosProvider";
import chalk from "chalk";
import { BigNumber } from "@ethersproject/bignumber";
import { AccountAddress } from "@aptos-labs/ts-sdk";

async function getReserveInfo() {
  // get assets addresses
  const assets: Array<AccountAddress> = [];
  const dai = underlyingTokens.find((token) => token.symbol === DAI).accountAddress;
  const weth = underlyingTokens.find((token) => token.symbol === WETH).accountAddress;
  const usdc = underlyingTokens.find((token) => token.symbol === USDC).accountAddress;
  const aave = underlyingTokens.find((token) => token.symbol === AAVE).accountAddress;
  const link = underlyingTokens.find((token) => token.symbol === LINK).accountAddress;
  const wbtc = underlyingTokens.find((token) => token.symbol === WBTC).accountAddress;
  assets.push(dai);
  assets.push(weth);
  assets.push(usdc);
  assets.push(aave);
  assets.push(link);
  assets.push(wbtc);

  // get assets base ltv
  const baseLtv: Array<string> = [];
  baseLtv.push(strategyDAI.baseLTVAsCollateral);
  baseLtv.push(strategyWETH.baseLTVAsCollateral);
  baseLtv.push(strategyUSDC.baseLTVAsCollateral);
  baseLtv.push(strategyAAVE.baseLTVAsCollateral);
  baseLtv.push(strategyLINK.baseLTVAsCollateral);
  baseLtv.push(strategyWBTC.baseLTVAsCollateral);

  // get assets liquidation threshold
  const liquidationThreshold: Array<string> = [];
  liquidationThreshold.push(strategyDAI.liquidationThreshold);
  liquidationThreshold.push(strategyWETH.liquidationThreshold);
  liquidationThreshold.push(strategyUSDC.liquidationThreshold);
  liquidationThreshold.push(strategyAAVE.liquidationThreshold);
  liquidationThreshold.push(strategyLINK.liquidationThreshold);
  liquidationThreshold.push(strategyWBTC.liquidationThreshold);

  // get assets liquidation bonus
  const liquidationBonus: Array<string> = [];
  liquidationBonus.push(strategyDAI.liquidationBonus);
  liquidationBonus.push(strategyWETH.liquidationBonus);
  liquidationBonus.push(strategyUSDC.liquidationBonus);
  liquidationBonus.push(strategyAAVE.liquidationBonus);
  liquidationBonus.push(strategyLINK.liquidationBonus);
  liquidationBonus.push(strategyWBTC.liquidationBonus);

  // reserve_factor
  const reserveFactor: Array<string> = [];
  reserveFactor.push(strategyDAI.reserveFactor);
  reserveFactor.push(strategyWETH.reserveFactor);
  reserveFactor.push(strategyUSDC.reserveFactor);
  reserveFactor.push(strategyAAVE.reserveFactor);
  reserveFactor.push(strategyLINK.reserveFactor);
  reserveFactor.push(strategyWBTC.reserveFactor);

  // borrow_cap
  const borrowCap: Array<string> = [];
  borrowCap.push(strategyDAI.borrowCap);
  borrowCap.push(strategyWETH.borrowCap);
  borrowCap.push(strategyUSDC.borrowCap);
  borrowCap.push(strategyAAVE.borrowCap);
  borrowCap.push(strategyLINK.borrowCap);
  borrowCap.push(strategyWBTC.borrowCap);

  // supply_cap
  const supplyCap: Array<string> = [];
  supplyCap.push(strategyDAI.supplyCap);
  supplyCap.push(strategyWETH.supplyCap);
  supplyCap.push(strategyUSDC.supplyCap);
  supplyCap.push(strategyAAVE.supplyCap);
  supplyCap.push(strategyLINK.supplyCap);
  supplyCap.push(strategyWBTC.supplyCap);

  // borrowing_enabled
  const borrowingEnabled: Array<boolean> = [];
  borrowingEnabled.push(strategyDAI.borrowingEnabled);
  borrowingEnabled.push(strategyWETH.borrowingEnabled);
  borrowingEnabled.push(strategyUSDC.borrowingEnabled);
  borrowingEnabled.push(strategyAAVE.borrowingEnabled);
  borrowingEnabled.push(strategyLINK.borrowingEnabled);
  borrowingEnabled.push(strategyWBTC.borrowingEnabled);

  // flash_loan_enabled
  const flashLoanEnabled: Array<boolean> = [];
  flashLoanEnabled.push(strategyDAI.flashLoanEnabled);
  flashLoanEnabled.push(strategyWETH.flashLoanEnabled);
  flashLoanEnabled.push(strategyUSDC.flashLoanEnabled);
  flashLoanEnabled.push(strategyAAVE.flashLoanEnabled);
  flashLoanEnabled.push(strategyLINK.flashLoanEnabled);
  flashLoanEnabled.push(strategyWBTC.flashLoanEnabled);

  // flash_loan_enabled
  const emodes: Array<number> = [];
  emodes.push(strategyDAI.emode);
  emodes.push(strategyWETH.emode);
  emodes.push(strategyUSDC.emode);
  emodes.push(strategyAAVE.emode);
  emodes.push(strategyLINK.emode);
  emodes.push(strategyWBTC.emode);

  // borrowable in isolation
  const borrowableIsolation: Array<boolean> = [];
  borrowableIsolation.push(strategyDAI.borrowableIsolation);
  borrowableIsolation.push(strategyWETH.borrowableIsolation);
  borrowableIsolation.push(strategyUSDC.borrowableIsolation);
  borrowableIsolation.push(strategyAAVE.borrowableIsolation);
  borrowableIsolation.push(strategyLINK.borrowableIsolation);
  borrowableIsolation.push(strategyWBTC.borrowableIsolation);

  return {
    assets,
    baseLtv,
    liquidationThreshold,
    liquidationBonus,
    reserveFactor,
    borrowCap,
    supplyCap,
    borrowingEnabled,
    flashLoanEnabled,
    emodes,
    borrowableIsolation,
  };
}

export async function configReserves() {
  const {
    assets,
    baseLtv,
    liquidationThreshold,
    liquidationBonus,
    reserveFactor,
    borrowCap,
    supplyCap,
    borrowingEnabled,
    flashLoanEnabled,
    emodes,
    borrowableIsolation,
  } = await getReserveInfo();

  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const poolClient = new PoolClient(aptosProvider, PoolManager);

  for (let index in assets) {
    let txReceipt = await poolClient.configureReserveAsCollateral(
      assets[index],
      BigNumber.from(baseLtv[index]),
      BigNumber.from(liquidationThreshold[index]),
      BigNumber.from(liquidationBonus[index]),
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} configured with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setReserveBorrowing(
      assets[index],
      borrowingEnabled[index],
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} enabled borrowing with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setReserveFlashLoaning(
      assets[index],
      flashLoanEnabled[index],
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} enabled flashloaning with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setReserveFactor(
      assets[index],
      BigNumber.from(reserveFactor[index]),
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} set factor with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setBorrowCap(
      assets[index],
      BigNumber.from(borrowCap[index]),
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} set borrow cap with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setSupplyCap(
      assets[index],
      BigNumber.from(supplyCap[index]),
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} set supply cap with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setAssetEmodeCategory(
      assets[index],
      emodes[index],
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} set emode ${emodes[index]} with tx hash = ${txReceipt.hash}`));

    txReceipt = await poolClient.setBorrowableInIsolation(
      assets[index],
      borrowableIsolation[index],
    );
    console.log(chalk.yellow(`Reserve ${assets[index]} set borrowing in isolation ${borrowableIsolation[index]} with tx hash = ${txReceipt.hash}`));
  }
}
