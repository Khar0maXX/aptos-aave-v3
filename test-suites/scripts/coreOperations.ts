/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { BigNumber } from "@ethersproject/bignumber";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import { PoolClient } from "../clients/poolClient";
import { CoreClient } from "../clients/coreClient";
import { AptosProvider } from "../wrappers/aptosProvider";
import { getTestAccounts } from "../configs/config";
import { AAVE_REFERRAL, INTEREST_RATE_MODES } from "../helpers/constants";
import { DAI, UnderlyingManager, WETH } from "../configs/tokens";
import { PoolManager } from "../configs/pool";
import { SupplyBorrowManager } from "../configs/supplyBorrow";
import chalk from "chalk";

(async () => {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();

  // all underlying-tokens-related operations client
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);

  // all pool-related operations client
  const poolClient = new PoolClient(aptosProvider, PoolManager);

  // all core-related operations client (supply, borrow, withdraw, repay)
  const coreClient = new CoreClient(aptosProvider, SupplyBorrowManager);

  // get all pool reserves
  const allReserveUnderlyingTokens = await poolClient.getAllReservesTokens();

  try {
    // ==============================MINT UNDERLYINGS FOR A TEST USER ===============================================
    console.log(chalk.yellow("---------------------------------------------"));
    console.log(chalk.cyan("Minting underlyings for test user..."));
    // get all reserve underlying tokens
    const supplier = (await getTestAccounts()).at(0);
    const baseMintAmount = 1000;

    for (const reserveUnderlyingToken of allReserveUnderlyingTokens) {
      const underlyingSymbol = await underlyingTokensClient.symbol(reserveUnderlyingToken.tokenAddress);
      const underlyingDecimals = await underlyingTokensClient.decimals(reserveUnderlyingToken.tokenAddress);
      const mintAmount = BigNumber.from(10).pow(underlyingDecimals).mul(baseMintAmount);
      const txReceipt = await underlyingTokensClient.mint(
        supplier.accountAddress,
        mintAmount,
        reserveUnderlyingToken.tokenAddress,
      );
      console.log(
        chalk.yellow(`Minted ${mintAmount.toString()} ${underlyingSymbol.toUpperCase()} to user account ${supplier.accountAddress.toString()}.
        Tx hash = ${txReceipt.hash}`),
      );
    }
    console.log(chalk.green("Minting underlyings for test user finished successfully!"));

    // ==============================USER SUPPLIES UNDERLYING AND GETS ATOKENS===============================================
    console.log(chalk.yellow("---------------------------------------------"));
    console.log(chalk.cyan("Supplying assets..."));
    coreClient.setSigner(supplier);
    for (const reserveUnderlyingToken of allReserveUnderlyingTokens) {
      const underlyingSymbol = await underlyingTokensClient.symbol(reserveUnderlyingToken.tokenAddress);
      const underlyingDecimals = await underlyingTokensClient.decimals(reserveUnderlyingToken.tokenAddress);
      const supplyAmount = BigNumber.from(10).pow(underlyingDecimals).mul(baseMintAmount).div(2);

      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} supplying ${supplyAmount.toString()} of underlying [${underlyingSymbol}, ${reserveUnderlyingToken.tokenAddress.toString()}] to the pool ...`),
      );

      // set the supplier to be the signer
      const txReceipt = await coreClient.supply(
        reserveUnderlyingToken.tokenAddress,
        supplyAmount,
        supplier.accountAddress,
        AAVE_REFERRAL,
      );
      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} successfully supplied ${supplyAmount.toString()} ${underlyingSymbol.toUpperCase()} to the pool.
        Tx hash = ${txReceipt.hash}`),
      );
    }
    console.log(chalk.green("Supplying assets for test user finished successfully!"));

    // ==============================USER BORROWS SOME ASSETS FROM POOL===============================================
    console.log(chalk.yellow("---------------------------------------------"));
    console.log(chalk.cyan("Borrowing assets..."));
    const underlyingsToBorrowSymbol = [DAI, WETH];
    coreClient.setSigner(supplier);
    const borrowedAssetsWithAmounts = new Map<string, BigNumber>();
    for (const underlyingToBorrowSymbol of underlyingsToBorrowSymbol) {
      const underlyingToBorrow = await underlyingTokensClient.getTokenAddress(underlyingToBorrowSymbol);
      const underlyingToBorrowDecimals = await underlyingTokensClient.decimals(underlyingToBorrow);
      const borrowAmount = BigNumber.from(10).pow(underlyingToBorrowDecimals).mul(baseMintAmount).div(5);

      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} borrowing ${borrowAmount.toString()} of underlying [${underlyingToBorrowSymbol}, ${underlyingToBorrow.toString()}] from the pool ...`),
      );

      borrowedAssetsWithAmounts.set(underlyingToBorrowSymbol, borrowAmount);
      const txReceipt = await coreClient.borrow(
        underlyingToBorrow,
        borrowAmount,
        INTEREST_RATE_MODES.VARIABLE,
        AAVE_REFERRAL,
        supplier.accountAddress,
      );
      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} successfully borrowed ${borrowAmount.toString()} of underlying [${underlyingToBorrowSymbol}, ${underlyingToBorrow.toString()}] from the pool.
        Tx hash = ${txReceipt.hash}`),
      );
    }
    console.log(chalk.green("Borrowing assets for test user finished successfully!"));

    // ==============================USER WITHDRAWS SOME HIS BORROWED ASSET FROM POOL===============================================
    console.log(chalk.yellow("---------------------------------------------"));
    console.log(chalk.cyan("Withdrawing assets..."));
    coreClient.setSigner(supplier);

    for (const underlyingToWithdrawSymbol of underlyingsToBorrowSymbol) {
      const underlyingToWithdraw = await underlyingTokensClient.getMetadataBySymbol(underlyingToWithdrawSymbol);
      const underlyingToWithdrawDecimals = await underlyingTokensClient.decimals(underlyingToWithdraw);
      const withdrawAmount = BigNumber.from(10).pow(underlyingToWithdrawDecimals).mul(baseMintAmount).div(5);
      const txReceipt = await coreClient.withdraw(underlyingToWithdraw, withdrawAmount, supplier.accountAddress);
      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} withdrew ${withdrawAmount.toString()} ${underlyingToWithdrawSymbol.toUpperCase()} from the pool.
        Tx hash = ${txReceipt.hash}`),
      );
    }
    console.log(chalk.green("Withdrawing assets for test user finished successfully!"));

    // ==============================USER REPAYS WHAT HE BORROWED FROM POOL USING THE SAME TOKENS ===============================================
    console.log(chalk.yellow("---------------------------------------------"));
    console.log(chalk.cyan("Repaying assets..."));
    coreClient.setSigner(supplier);

    for (const [key, borrowedValue] of borrowedAssetsWithAmounts.entries()) {
      const underlyingToRepay = await underlyingTokensClient.getMetadataBySymbol(key);
      const txReceipt = await coreClient.repay(
        underlyingToRepay,
        borrowedValue,
        INTEREST_RATE_MODES.VARIABLE,
        supplier.accountAddress,
      );
      console.log(
        chalk.yellow(`User ${supplier.accountAddress.toString()} repayed ${borrowedValue.toString()} ${key.toUpperCase()} from the pool.
        Tx hash = ${txReceipt.hash}`),
      );
    }
    console.log(chalk.yellow("Repaying assets for test user finished successfully!"));
  } catch (ex) {
    console.error("Exception = ", ex);
  }
})();
