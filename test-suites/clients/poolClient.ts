import { AccountAddress, CommittedTransactionResponse, MoveOption } from "@aptos-labs/ts-sdk";
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
  GetReserveEModeCategoryFuncAddr,
  GetReserveTokensAddressesFuncAddr,
  GetSiloedBorrowingFuncAddr,
  GetTotalDebtFuncAddr,
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
  PoolConfiguratorUpdateFlashloanPremiumToProtocolFuncAddr,
  PoolConfiguratorUpdateFlashloanPremiumTotalFuncAddr,
  PoolConfigureEmodeCategoryFuncAddr,
  PoolGetEmodeCategoryDataFuncAddr,
  PoolGetFlashloanPremiumToProtocolFuncAddr,
  PoolGetFlashloanPremiumTotalFuncAddr,
  PoolGetReserveAddressByIdFuncAddr,
  PoolGetReserveConfigurationFuncAddr,
  PoolGetReserveDataFuncAddr,
  PoolGetReserveConfigurationByReserveData,
  PoolGetReserveLiquidityIndex,
  PoolGetReserveCurrentLiquidityRate,
  PoolGetReserveVariableBorrowIndex,
  PoolGetReserveCurrentVariableBorrowRate,
  PoolGetReserveLastUpdateTimestamp,
  PoolGetReserveId,
  PoolGetReserveATokenAddress,
  PoolGetReserveVariableDebtTokenAddress,
  PoolGetReserveAccruedToTreasury,
  PoolGetReserveIsolationModeTotalDebt,
  PoolGetReserveNormalizedIncomeFuncAddr,
  PoolGetReserveNormalizedVariableDebtFuncAddr,
  PoolGetReservesCountFuncAddr,
  PoolGetReservesListFuncAddr,
  PoolGetRevisionFuncAddr,
  PoolGetUserConfigurationFuncAddr,
  PoolGetUserEmodeFuncAddr,
  PoolMaxNumberReservesFuncAddr,
  PoolMintToTreasuryFuncAddr,
  PoolResetIsolationModeTotalDebtFuncAddr,
  PoolScaledATokenBalanceOfFuncAddr,
  PoolScaledATokenTotalSupplyFuncAddr,
  PoolScaledVariableTokenBalanceOfFuncAddr,
  PoolScaledVariableTokenTotalSupplyFuncAddr,
  PoolSetFlashloanPremiumsFuncAddr,
  PoolSetUserEmodeFuncAddr, UpdateInterestRateStrategyFuncAddr,
} from "../configs/pool";
import { mapToBN } from "../helpers/contractHelper";
import { Object } from "../helpers/interfaces";

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
  configuration: { data: number };
  /// the liquidity index. Expressed in ray
  liquidityIndex: bigint;
  /// the current supply rate. Expressed in ray
  currentLiquidityRate: bigint;
  /// variable borrow index. Expressed in ray
  variableBorrowIndex: bigint;
  /// the current variable borrow rate. Expressed in ray
  currentVariableBorrowRate: bigint;
  /// timestamp of last update (u40 -> u64)
  lastUpdateTimestamp: number;
  /// the id of the reserve. Represents the position in the list of the active reserves
  id: number;
  /// aToken address
  aTokenAddress: AccountAddress;
  /// variableDebtToken address
  variableDebtTokenAddress: AccountAddress;
  /// the current treasury balance, scaled
  accruedToTreasury: bigint;
  /// the outstanding debt borrowed against this asset in isolation mode
  isolationModeTotalDebt: bigint;
};

export type ReserveData2 = {
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

  public async getReserveConfigurationByReserveData(object: AccountAddress): Promise<ReserveConfigurationMap> {
    const [resp] = await this.callViewMethod(PoolGetReserveConfigurationByReserveData, [object]);
    return resp as ReserveConfigurationMap;
  }

  public async getReserveLiquidityIndex(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveLiquidityIndex, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveCurrentLiquidityRate(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveCurrentLiquidityRate, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveVariableBorrowIndex(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveVariableBorrowIndex, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveCurrentVariableBorrowRate(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveCurrentVariableBorrowRate, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveLastUpdateTimestamp(object: AccountAddress): Promise<number> {
    const [resp] = await this.callViewMethod(PoolGetReserveLastUpdateTimestamp, [object]);
    return resp as number;
  }

  public async getReserveId(object: AccountAddress): Promise<number> {
    const [resp] = await this.callViewMethod(PoolGetReserveId, [object]);
    return resp as number;
  }

  public async getReserveATokenAddress(object: AccountAddress): Promise<AccountAddress> {
    const [resp] = await this.callViewMethod(PoolGetReserveATokenAddress, [object]);
    return AccountAddress.fromString(resp as string)
  }

  public async getReserveVariableDebtTokenAddress(object: AccountAddress): Promise<AccountAddress> {
    const [resp] = await this.callViewMethod(PoolGetReserveVariableDebtTokenAddress, [object]);
    return AccountAddress.fromString(resp as string)
  }

  public async getReserveAccruedToTreasury(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveAccruedToTreasury, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveIsolationModeTotalDebt(object: AccountAddress): Promise<bigint> {
    const [resp] = await this.callViewMethod(PoolGetReserveIsolationModeTotalDebt, [object]);
    return BigInt(resp.toString());
  }

  public async getReserveData(asset: AccountAddress): Promise<ReserveData> {
    const [resp] = await this.callViewMethod(PoolGetReserveDataFuncAddr, [asset]);
    const object = AccountAddress.fromString((resp as Object).inner);

    return {
      configuration: await this.getReserveConfigurationByReserveData(object),
      liquidityIndex: await this.getReserveLiquidityIndex(object),
      currentLiquidityRate:await this.getReserveCurrentLiquidityRate(object),
      variableBorrowIndex: await this.getReserveVariableBorrowIndex(object),
      currentVariableBorrowRate: await this.getReserveCurrentVariableBorrowRate(object),
      lastUpdateTimestamp: await this.getReserveLastUpdateTimestamp(object),
      id: await this.getReserveId(object),
      aTokenAddress: await this.getReserveATokenAddress(object),
      variableDebtTokenAddress: await this.getReserveVariableDebtTokenAddress(object),
      accruedToTreasury: await this.getReserveAccruedToTreasury(object),
      isolationModeTotalDebt: await this.getReserveIsolationModeTotalDebt(object),
    } as ReserveData;
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

  public async updateInterestRateStrategy(
      asset: AccountAddress,
      optimalUsageRatio: BigNumber,
      baseVariableBorrowRate: BigNumber,
      variableRateSlope1: BigNumber,
      variableRateSlope2: BigNumber,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(UpdateInterestRateStrategyFuncAddr, [
      asset,
      optimalUsageRatio.toString(),
      baseVariableBorrowRate.toString(),
      variableRateSlope1.toString(),
      variableRateSlope2.toString(),
    ]);
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
    label: string,
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetEmodeCategoryFuncAddr, [
      categoryId,
      ltv,
      liquidationThreshold,
      liquidationBonus,
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
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetPoolPauseFuncAddr, [paused, 0]);
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

  public async setReservePause(asset: AccountAddress, paused: boolean, gracePeriod: number = 0): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetReservePauseFuncAddr, [asset, paused, gracePeriod]);
  }

  public async setSiloedBorrowing(asset: AccountAddress, newSiloed: boolean): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetSiloedBorrowingFuncAddr, [asset, newSiloed]);
  }

  public async setSupplyCap(asset: AccountAddress, newSupplyCap: BigNumber): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorSetSupplyCapFuncAddr, [asset, newSupplyCap.toString()]);
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
    incentivesController: Array<MoveOption<AccountAddress>>,
    optimalUsageRatio: Array<BigNumber>,
    baseVariableBorrowRate: Array<BigNumber>,
    variableRateSlope1: Array<BigNumber>,
    variableRateSlope2: Array<BigNumber>
  ): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(PoolConfiguratorInitReservesFuncAddr, [
      underlyingAssets,
      treasury,
      aTokenName,
      aTokenSymbol,
      variableDebtTokenName,
      variableDebtTokenSymbol,
      incentivesController,
      optimalUsageRatio.map(item => item.toString()),
      baseVariableBorrowRate.map(item => item.toString()),
      variableRateSlope1.map(item => item.toString()),
      variableRateSlope2.map(item => item.toString()),
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

  public async getDebtCeiling(asset: AccountAddress): Promise<BigNumber> {
    const [debtCeiling] = (await this.callViewMethod(GetDebtCeilingFuncAddr, [asset])).map(mapToBN);
    return debtCeiling;
  }

  public async getDebtCeilingDecimals(asset: AccountAddress): Promise<BigNumber> {
    const [debtCeiling] = (await this.callViewMethod(GetDebtCeilingDecimalsFuncAddr, [asset])).map(mapToBN);
    return debtCeiling;
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
