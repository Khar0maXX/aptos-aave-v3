import { AccountAddress, CommittedTransactionResponse } from "@aptos-labs/ts-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { AptosContractWrapperBaseClass } from "./baseClass";
import {
  GetATokenTotalSupplyFuncAddr,
  GetAllATokensFuncAddr,
  GetAllReservesTokensFuncAddr,
  GetAllVariableTokensFuncAddr,
  GetDebtCeilingDecimalsFuncAddr,
  GetDebtCeilingFuncAddr,
  GetFlashLoanEnabledFuncAddr,
  GetLiquidationProtocolFeeTokensFuncAddr,
  GetPausedFuncAddr,
  GetReserveCapsFuncAddr,
  GetReserveDataAndReservesCountFuncAddr,
  GetReserveEModeCategoryFuncAddr,
  GetReserveTokensAddressesFuncAddr,
  GetSiloedBorrowingFuncAddr,
  GetTotalDebtFuncAddr,
  GetUnbackedMintCapFuncAddr,
  GetUserReserveDataFuncAddr,
  PoolConfiguratorInitReservesFuncAddr,
  PoolConfiguratorConfigureReserveAsCollateralFuncAddr,
  PoolConfiguratorDropReserveFuncAddr,
  PoolConfiguratorGetRevisionFuncAddr,
  PoolConfiguratorSetAssetEmodeCategoryFuncAddr,
  PoolConfiguratorSetBorrowCapFuncAddr,
  PoolConfiguratorSetBorrowableInIsolationFuncAddr,
  PoolConfiguratorSetDebtCeilingFuncAddr,
  PoolConfiguratorSetEmodeCategoryFuncAddr,
  PoolConfiguratorSetLiquidationProtocolFeeFuncAddr,
  PoolConfiguratorSetPoolPauseFuncAddr,
  PoolConfiguratorSetReserveActiveFuncAddr,
  PoolConfiguratorSetReserveBorrowingFuncAddr,
  PoolConfiguratorSetReserveFactorFuncAddr,
  PoolConfiguratorSetReserveFlashLoaningFuncAddr,
  PoolConfiguratorSetReserveFreezeFuncAddr,
  PoolConfiguratorSetReservePauseFuncAddr,
  PoolConfiguratorSetSiloedBorrowingFuncAddr,
  PoolConfiguratorSetSupplyCapFuncAddr,
  PoolConfiguratorSetUnbackedMintCapFuncAddr,
  PoolConfiguratorUpdateBridgeProtocolFeeFuncAddr,
  PoolConfiguratorUpdateFlashloanPremiumToProtocolFuncAddr,
  PoolConfiguratorUpdateFlashloanPremiumTotalFuncAddr,
  PoolConfigureEmodeCategoryFuncAddr,
  PoolGetBridgeProtocolFeeFuncAddr,
  PoolGetEmodeCategoryDataFuncAddr,
  PoolGetFlashloanPremiumToProtocolFuncAddr,
  PoolGetFlashloanPremiumTotalFuncAddr,
  PoolGetReserveAddressByIdFuncAddr,
  PoolGetReserveConfigurationFuncAddr,
  PoolGetReserveDataFuncAddr,
  PoolGetReserveNormalizedIncomeFuncAddr,
  PoolGetReserveNormalizedVariableDebtFuncAddr,
  PoolGetReservesCountFuncAddr,
  PoolGetReservesListFuncAddr,
  PoolGetRevisionFuncAddr,
  PoolGetUserConfigurationFuncAddr,
  PoolGetUserEmodeFuncAddr,
  PoolMaxNumberReservesFuncAddr,
  PoolMintToTreasuryFuncAddr,
  PoolRescueTokensFuncAddr,
  PoolResetIsolationModeTotalDebtFuncAddr,
  PoolScaledATokenBalanceOfFuncAddr,
  PoolScaledATokenTotalSupplyFuncAddr,
  PoolScaledVariableTokenBalanceOfFuncAddr,
  PoolScaledVariableTokenTotalSupplyFuncAddr,
  PoolSetBridgeProtocolFeeFuncAddr,
  PoolSetFlashloanPremiumsFuncAddr,
  PoolSetUserEmodeFuncAddr,
} from "../configs/pool";
import { mapToBN } from "../helpers/contractHelper";

export type ReserveConfigurationMap = {
  data: Number;
};

export type UserConfigurationMap = {
  data: Number;
};

export interface TokenData {
  symbol: string;
  tokenAddress: AccountAddress;
}

export interface UserReserveData {
  currentATokenBalance: BigNumber;
  currentVariableDebt: BigNumber;
  scaledVariableDebt: BigNumber;
  liquidityRate: BigNumber;
  usageAsCollateralEnabled: boolean;
}

export type ReserveData = {
  /// stores the reserve configuration
  configuration: { data: Number };
  /// the liquidity index. Expressed in ray
  liquidity_index: Number;
  /// the current supply rate. Expressed in ray
  current_liquidity_rate: Number;
  /// variable borrow index. Expressed in ray
  variable_borrow_index: Number;
  /// the current variable borrow rate. Expressed in ray
  current_variable_borrow_rate: Number;
  /// the current stable borrow rate. Expressed in ray
  current_stable_borrow_rate: Number;
  /// timestamp of last update (u40 -> u64)
  last_update_timestamp: Number;
  /// the id of the reserve. Represents the position in the list of the active reserves
  id: Number;
  /// aToken address
  a_token_address: string;
  /// stableDebtToken address
  stable_debt_token_address: string;
  /// variableDebtToken address
  variable_debt_token_address: string;
  /// address of the interest rate strategy
  interest_rate_strategy_address: string;
  /// the current treasury balance, scaled
  accrued_to_treasury: Number;
  /// the outstanding unbacked aTokens minted through the bridging feature
  unbacked: Number;
  /// the outstanding debt borrowed against this asset in isolation mode
  isolation_mode_total_debt: Number;
};

export type ReserveData2 = {
  reserveUnbacked: BigNumber;
  reserveAccruedToTreasury: BigNumber;
  aTokenSupply: BigNumber;
  varTokenSupply: BigNumber;
  reserveCurrentLiquidityRate: BigNumber;
  reserveCurrentVariableBorrowRate: BigNumber;
  reserveLiquidityIndex: BigNumber;
  reserveVarBorrowIndex: BigNumber;
  reserveLastUpdateTimestamp: BigNumber;
};

export type ReserveEmodeCategory = {
  decimals: BigNumber;
  ltv: BigNumber;
  liquidationThreshold: BigNumber;
  liquidationBonus: BigNumber;
  reserveFactor: BigNumber;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
};

export class PoolClient extends AptosContractWrapperBaseClass {
  public async mintToTreasury(assets: Array<AccountAddress>): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolMintToTreasuryFuncAddr, [assets]);
  }

  public async resetIsolationModeTotalDebt(asset: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolResetIsolationModeTotalDebtFuncAddr, [asset]);
  }

  public async rescueTokens(
    token: AccountAddress,
    to: AccountAddress,
    amount: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolRescueTokensFuncAddr, [token, to, amount.toString()]);
  }

  public async setBridgeProtocolFee(protocolFee: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolSetBridgeProtocolFeeFuncAddr, [protocolFee.toString()]);
  }

  public async setFlashloanPremiums(
    flashloanPremiumTotal: BigNumber,
    flashloanPremiumToProtocol: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolSetFlashloanPremiumsFuncAddr, [
      flashloanPremiumTotal.toString(),
      flashloanPremiumToProtocol.toString(),
    ]);
  }

  public async getRevision(): Promise<number> {
    const [resp] = await this.callViewMethod(PoolGetRevisionFuncAddr, []);
    return resp as number;
  }

  public async getReserveConfiguration(asset: AccountAddress): Promise<ReserveConfigurationMap> {
    const [resp] = await this.callViewMethod(PoolGetReserveConfigurationFuncAddr, [asset]);
    return resp as ReserveConfigurationMap;
  }

  public async getReserveData(asset: AccountAddress): Promise<{ reserveData: ReserveData; count: number }> {
    const [resp] = await this.callViewMethod(PoolGetReserveDataFuncAddr, [asset]);
    return { reserveData: resp[0] as ReserveData, count: resp[1] as number };
  }

  public async getReserveDataAndReservesCount(asset: AccountAddress): Promise<ReserveData> {
    const [resp] = await this.callViewMethod(GetReserveDataAndReservesCountFuncAddr, [asset]);
    return resp as ReserveData;
  }

  public async getReservesCount(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetReservesCountFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async getReservesList(): Promise<Array<AccountAddress>> {
    const resp = ((await this.callViewMethod(PoolGetReservesListFuncAddr, [])).at(0) as Array<any>).map((item) =>
      AccountAddress.fromString(item as string),
    );
    return resp;
  }

  public async getReserveAddressById(id: number): Promise<AccountAddress> {
    const [resp] = await this.callViewMethod(PoolGetReserveAddressByIdFuncAddr, [id]);
    return AccountAddress.fromString(resp as string);
  }

  public async getReserveNormalizedVariableDebt(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetReserveNormalizedVariableDebtFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getReserveNormalizedIncome(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetReserveNormalizedIncomeFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getUserConfiguration(account: AccountAddress): Promise<UserConfigurationMap> {
    const [resp] = await this.callViewMethod(PoolGetUserConfigurationFuncAddr, [account]);
    return resp as UserConfigurationMap;
  }

  public async getBridgeProtocolFee(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetBridgeProtocolFeeFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async getFlashloanPremiumTotal(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetFlashloanPremiumTotalFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async getFlashloanPremiumToProtocol(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolGetFlashloanPremiumToProtocolFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async getMaxNumberReserves(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolMaxNumberReservesFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async addReserves(
    aTokenImpl: Array<AccountAddress>,
    variableDebtTokenImpl: Array<BigNumber>,
    underlyingAssetDecimals: Array<BigNumber>,
    underlyingAsset: Array<AccountAddress>,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorInitReservesFuncAddr, [
      aTokenImpl,
      variableDebtTokenImpl.map((item) => item.toString()),
      underlyingAssetDecimals.map((item) => item.toString()),
      underlyingAsset,
    ]);
  }

  public async dropReserve(asset: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorDropReserveFuncAddr, [asset]);
  }

  public async setAssetEmodeCategory(
    asset: AccountAddress,
    newCategoryId: number,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetAssetEmodeCategoryFuncAddr, [asset, newCategoryId]);
  }

  public async setBorrowCap(asset: AccountAddress, newBorrowCap: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetBorrowCapFuncAddr, [asset, newBorrowCap.toString()]);
  }

  public async setBorrowableInIsolation(
    asset: AccountAddress,
    borrowable: boolean,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetBorrowableInIsolationFuncAddr, [asset, borrowable]);
  }

  public async setEmodeCategory(
    categoryId: number,
    ltv: number,
    liquidationThreshold: number,
    liquidationBonus: number,
    oracle: AccountAddress,
    label: string,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetEmodeCategoryFuncAddr, [
      categoryId,
      ltv,
      liquidationThreshold,
      liquidationBonus,
      oracle,
      label,
    ]);
  }

  public async setLiquidationProtocolFee(
    asset: AccountAddress,
    newFee: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetLiquidationProtocolFeeFuncAddr, [asset, newFee.toString()]);
  }

  public async setPoolPause(paused: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetPoolPauseFuncAddr, [paused]);
  }

  public async setReserveActive(asset: AccountAddress, active: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReserveActiveFuncAddr, [asset, active]);
  }

  public async setReserveBorrowing(asset: AccountAddress, enabled: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReserveBorrowingFuncAddr, [asset, enabled]);
  }

  public async setDebtCeiling(asset: AccountAddress, newDebtCeiling: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetDebtCeilingFuncAddr, [asset, newDebtCeiling.toString()]);
  }

  public async configureReserveAsCollateral(
    asset: AccountAddress,
    ltv: BigNumber,
    liquidationThreshold: BigNumber,
    liquidationBonus: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorConfigureReserveAsCollateralFuncAddr, [
      asset,
      ltv.toString(),
      liquidationThreshold.toString(),
      liquidationBonus.toString(),
    ]);
  }

  public async setReserveFactor(
    asset: AccountAddress,
    newReserveFactor: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReserveFactorFuncAddr, [asset, newReserveFactor.toString()]);
  }

  public async setReserveFlashLoaning(asset: AccountAddress, enabled: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReserveFlashLoaningFuncAddr, [asset, enabled]);
  }

  public async setReserveFreeze(asset: AccountAddress, freeze: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReserveFreezeFuncAddr, [asset, freeze]);
  }

  public async setReservePause(asset: AccountAddress, paused: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReservePauseFuncAddr, [asset, paused]);
  }

  public async setSiloedBorrowing(asset: AccountAddress, newSiloed: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetSiloedBorrowingFuncAddr, [asset, newSiloed]);
  }

  public async setSupplyCap(asset: AccountAddress, newSupplyCap: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetSupplyCapFuncAddr, [asset, newSupplyCap.toString()]);
  }

  public async setUnbackedMintCap(
    asset: AccountAddress,
    newUnbackedMintCap: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetUnbackedMintCapFuncAddr, [
      asset,
      newUnbackedMintCap.toString(),
    ]);
  }

  public async updateBridgeProtocolFee(newBridgeProtocolFee: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorUpdateBridgeProtocolFeeFuncAddr, [
      newBridgeProtocolFee.toString(),
    ]);
  }

  public async updateFloashloanPremiumToProtocol(
    newFlashloanPremiumToProtocol: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorUpdateFlashloanPremiumToProtocolFuncAddr, [
      newFlashloanPremiumToProtocol.toString(),
    ]);
  }

  public async updateFloashloanPremiumTotal(
    newFlashloanPremiumTotal: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorUpdateFlashloanPremiumTotalFuncAddr, [
      newFlashloanPremiumTotal.toString(),
    ]);
  }

  public async initReserves(
    underlyingAssets: Array<AccountAddress>,
    treasury: Array<AccountAddress>,
    aTokenName: Array<string>,
    aTokenSymbol: Array<string>,
    variableDebtTokenName: Array<string>,
    variableDebtTokenSymbol: Array<string>,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorInitReservesFuncAddr, [
      underlyingAssets,
      treasury,
      aTokenName,
      aTokenSymbol,
      variableDebtTokenName,
      variableDebtTokenSymbol,
    ]);
  }

  public async getPoolConfiguratorRevision(): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(PoolConfiguratorGetRevisionFuncAddr, [])).map(mapToBN);
    return resp;
  }

  public async setUserEmode(categoryId: number): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolSetUserEmodeFuncAddr, [categoryId]);
  }

  public async configureEmodeCategory(
    ltv: number,
    liquidationThreshold: number,
    liquidationBonus: number,
    priceSource: AccountAddress,
    label: string,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfigureEmodeCategoryFuncAddr, [
      ltv,
      liquidationThreshold,
      liquidationBonus,
      priceSource,
      label,
    ]);
  }

  public async getEmodeCategoryData(id: number): Promise<number> {
    const [resp] = await this.callViewMethod(PoolGetEmodeCategoryDataFuncAddr, [id]);
    return resp as number;
  }

  public async getUserEmode(user: AccountAddress): Promise<number> {
    const [resp] = await this.callViewMethod(PoolGetUserEmodeFuncAddr, [user]);
    return resp as number;
  }

  public async getAllReservesTokens(): Promise<Array<TokenData>> {
    const resp = ((await this.callViewMethod(GetAllReservesTokensFuncAddr, [])).at(0) as Array<any>).map(
      (item) =>
        ({
          symbol: item.symbol as string,
          tokenAddress: AccountAddress.fromString(item.token_address as string),
        }) as TokenData,
    );
    return resp;
  }

  public async getAllATokens(): Promise<Array<TokenData>> {
    const resp = ((await this.callViewMethod(GetAllATokensFuncAddr, [])).at(0) as Array<any>).map(
      (item) =>
        ({
          symbol: item.symbol as string,
          tokenAddress: AccountAddress.fromString(item.token_address as string),
        }) as TokenData,
    );
    return resp;
  }

  public async getAllVariableTokens(): Promise<Array<TokenData>> {
    const resp = ((await this.callViewMethod(GetAllVariableTokensFuncAddr, [])).at(0) as Array<any>).map(
      (item) =>
        ({
          symbol: item.symbol as string,
          tokenAddress: AccountAddress.fromString(item.token_address as string),
        }) as TokenData,
    );
    return resp;
  }

  public async getReserveEmodeCategory(asset: AccountAddress): Promise<ReserveEmodeCategory> {
    const [
      decimals,
      ltv,
      liquidationThreshold,
      liquidationBonus,
      reserveFactor,
      usageAsCollateralEnabled,
      borrowingEnabled,
      isActive,
      isFrozen,
    ] = await this.callViewMethod(GetReserveEModeCategoryFuncAddr, [asset]);
    return {
      decimals: BigNumber.from(decimals),
      ltv: BigNumber.from(ltv),
      liquidationThreshold: BigNumber.from(liquidationThreshold),
      liquidationBonus: BigNumber.from(liquidationBonus),
      reserveFactor: BigNumber.from(reserveFactor),
      usageAsCollateralEnabled: usageAsCollateralEnabled as boolean,
      borrowingEnabled: borrowingEnabled as boolean,
      isActive: isActive as boolean,
      isFrozen: isFrozen as boolean,
    };
  }

  public async getReserveCaps(asset: AccountAddress): Promise<{
    borrowCap: BigNumber;
    supplyCap: BigNumber;
  }> {
    const [borrowCap, supplyCap] = await this.callViewMethod(GetReserveCapsFuncAddr, [asset]);
    return {
      borrowCap: BigNumber.from(borrowCap),
      supplyCap: BigNumber.from(supplyCap),
    };
  }

  public async getPaused(asset: AccountAddress): Promise<boolean> {
    const [isSiloedBorrowing] = await this.callViewMethod(GetPausedFuncAddr, [asset]);
    return isSiloedBorrowing as boolean;
  }

  public async getSiloedBorrowing(asset: AccountAddress): Promise<boolean> {
    const [isSiloedBorrowing] = await this.callViewMethod(GetSiloedBorrowingFuncAddr, [asset]);
    return isSiloedBorrowing as boolean;
  }

  public async getLiquidationProtocolFee(asset: AccountAddress): Promise<BigNumber> {
    const [isSiloedBorrowing] = (await this.callViewMethod(GetLiquidationProtocolFeeTokensFuncAddr, [asset])).map(
      mapToBN,
    );
    return isSiloedBorrowing;
  }

  public async getUnbackedMintCap(asset: AccountAddress): Promise<BigNumber> {
    const [unbackedMintCap] = (await this.callViewMethod(GetUnbackedMintCapFuncAddr, [asset])).map(mapToBN);
    return unbackedMintCap;
  }

  public async getDebtCeiling(asset: AccountAddress): Promise<BigNumber> {
    const [debtCeiling] = (await this.callViewMethod(GetDebtCeilingFuncAddr, [asset])).map(mapToBN);
    return debtCeiling;
  }

  public async getDebtCeilingDecimals(asset: AccountAddress): Promise<BigNumber> {
    const [debtCeiling] = (await this.callViewMethod(GetDebtCeilingDecimalsFuncAddr, [asset])).map(mapToBN);
    return debtCeiling;
  }

  public async getReserveData2(asset: AccountAddress): Promise<ReserveData2> {
    const [
      reserveUnbacked,
      reserveAccruedToTreasury,
      aTokenSupply,
      varTokenSupply,
      reserveCurrentLiquidityRate,
      reserveCurrentVariableBorrowRate,
      reserveLiquidityIndex,
      reserveVarBorrowIndex,
      reserveLastUpdateTimestamp,
    ] = await this.callViewMethod(GetReserveEModeCategoryFuncAddr, [asset]);
    return {
      reserveUnbacked: BigNumber.from(reserveUnbacked),
      reserveAccruedToTreasury: BigNumber.from(reserveAccruedToTreasury),
      aTokenSupply: BigNumber.from(aTokenSupply),
      varTokenSupply: BigNumber.from(varTokenSupply),
      reserveCurrentLiquidityRate: BigNumber.from(reserveCurrentLiquidityRate),
      reserveCurrentVariableBorrowRate: BigNumber.from(reserveCurrentVariableBorrowRate),
      reserveLiquidityIndex: BigNumber.from(reserveLiquidityIndex),
      reserveVarBorrowIndex: BigNumber.from(reserveVarBorrowIndex),
      reserveLastUpdateTimestamp: BigNumber.from(reserveLastUpdateTimestamp),
    } as ReserveData2;
  }

  public async getATokenTotalSupply(asset: AccountAddress): Promise<BigNumber> {
    const [totalSupply] = (await this.callViewMethod(GetATokenTotalSupplyFuncAddr, [asset])).map(mapToBN);
    return totalSupply;
  }

  public async getTotalDebt(asset: AccountAddress): Promise<BigNumber> {
    const [totalDebt] = (await this.callViewMethod(GetTotalDebtFuncAddr, [asset])).map(mapToBN);
    return totalDebt;
  }

  public async getUserReserveData(asset: AccountAddress): Promise<UserReserveData> {
    const [currentATokenBalance, currentVariableDebt, scaledVariableDebt, liquidityRate, usageAsCollateralEnabled] =
      await this.callViewMethod(GetUserReserveDataFuncAddr, [asset]);
    return {
      currentATokenBalance: BigNumber.from(currentATokenBalance),
      currentVariableDebt: BigNumber.from(currentVariableDebt),
      scaledVariableDebt: BigNumber.from(scaledVariableDebt),
      liquidityRate: BigNumber.from(liquidityRate),
      usageAsCollateralEnabled: usageAsCollateralEnabled as boolean,
    } as UserReserveData;
  }

  public async getReserveTokensAddresses(
    asset: AccountAddress,
  ): Promise<{ reserveATokenAddress: AccountAddress; reserveVariableDebtTokenAddress: AccountAddress }> {
    const [reserveATokenAddress, reserveVariableDebtTokenAddress] = await this.callViewMethod(
      GetReserveTokensAddressesFuncAddr,
      [asset],
    );
    return {
      reserveATokenAddress: AccountAddress.fromString(reserveATokenAddress as string),
      reserveVariableDebtTokenAddress: AccountAddress.fromString(reserveVariableDebtTokenAddress as string),
    };
  }

  public async getFlashloanEnabled(asset: AccountAddress): Promise<boolean> {
    const [isFlashloanEnabled] = await this.callViewMethod(GetFlashLoanEnabledFuncAddr, [asset]);
    return isFlashloanEnabled as boolean;
  }

  public async getScaledATokenTotalSupply(aTokenAddress: AccountAddress): Promise<BigNumber> {
    const [totalSupply] = (await this.callViewMethod(PoolScaledATokenTotalSupplyFuncAddr, [aTokenAddress])).map(
      mapToBN,
    );
    return totalSupply;
  }

  public async getScaledATokenBalanceOf(owner: AccountAddress, aTokenAddress: AccountAddress): Promise<BigNumber> {
    const [balance] = (await this.callViewMethod(PoolScaledATokenBalanceOfFuncAddr, [owner, aTokenAddress])).map(
      mapToBN,
    );
    return balance;
  }

  public async getScaledVariableTokenTotalSupply(aTokenAddress: AccountAddress): Promise<BigNumber> {
    const [totalSupply] = (await this.callViewMethod(PoolScaledVariableTokenTotalSupplyFuncAddr, [aTokenAddress])).map(
      mapToBN,
    );
    return totalSupply;
  }

  public async getScaledVariableTokenBalanceOf(
    owner: AccountAddress,
    varTokenAddress: AccountAddress,
  ): Promise<BigNumber> {
    const [balance] = (
      await this.callViewMethod(PoolScaledVariableTokenBalanceOfFuncAddr, [owner, varTokenAddress])
    ).map(mapToBN);
    return balance;
  }
}
