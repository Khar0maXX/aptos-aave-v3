import { AccountAddress, CommittedTransactionResponse } from "@aptos-labs/ts-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { AptosContractWrapperBaseClass } from "./baseClass";
import {
  CalculateInterestRatesFuncAddr,
  GetBaseVariableBorrowRateFuncAddr,
  GetGetOptimalUsageRatioFuncAddr,
  GetMaxVariableBorrowRateFuncAddr,
  GetVariableRateSlope1FuncAddr,
  GetVariableRateSlope2FuncAddr,
} from "../configs/rates";
import { mapToBN } from "../helpers/contractHelper";

export class DefaultInterestRateStrategyClient extends AptosContractWrapperBaseClass {

  public async getOptimalUsageRatio(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetGetOptimalUsageRatioFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getVariableRateSlope1(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetVariableRateSlope1FuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getVariableRateSlope2(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetVariableRateSlope2FuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getBaseVariableBorrowRate(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetBaseVariableBorrowRateFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getMaxVariableBorrowRate(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetMaxVariableBorrowRateFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async calculateInterestRates(
    unbacked: BigNumber,
    liquidityAdded: BigNumber,
    liquidityTaken: BigNumber,
    totalVariableDebt: BigNumber,
    reserveFactor: BigNumber,
    reserve: AccountAddress,
    virtualUnderlyingBalance: BigNumber,
  ): Promise<{ currentLiquidityRate: BigNumber; currentVariableBorrowRate: BigNumber }> {
    const [currentLiquidityRate, currentVariableBorrowRate] = await this.callViewMethod(
      CalculateInterestRatesFuncAddr,
      [
        unbacked.toString(),
        liquidityAdded.toString(),
        liquidityTaken.toString(),
        totalVariableDebt.toString(),
        reserveFactor.toString(),
        reserve,
        virtualUnderlyingBalance.toString(),
      ],
    );
    return {
      currentLiquidityRate: BigNumber.from(currentLiquidityRate),
      currentVariableBorrowRate: BigNumber.from(currentVariableBorrowRate),
    };
  }
}
