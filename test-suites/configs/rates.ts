import { Account, MoveFunctionId } from "@aptos-labs/ts-sdk";
import { AptosProvider } from "../wrappers/aptosProvider";

// Resources Admin Account
// AAVE RATE
const aptosProvider = AptosProvider.fromEnvs();
export const PoolManager = Account.fromPrivateKey({
  privateKey: aptosProvider.getProfileAccountPrivateKeyByName("aave_pool"),
});

export const PoolManagerAccountAddress = PoolManager.accountAddress.toString();

/**
 * -------------------------------------------------------------------------
 * default_reserve_interest_rate_strategy
 * -------------------------------------------------------------------------
 */
// Entry
// View
export const GetGetOptimalUsageRatioFuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::get_optimal_usage_ratio`;
export const GetVariableRateSlope1FuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::get_variable_rate_slope1`;
export const GetVariableRateSlope2FuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::get_variable_rate_slope2`;
export const GetBaseVariableBorrowRateFuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::get_base_variable_borrow_rate`;
export const GetMaxVariableBorrowRateFuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::get_max_variable_borrow_rate`;
export const CalculateInterestRatesFuncAddr: MoveFunctionId = `${PoolManagerAccountAddress}::default_reserve_interest_rate_strategy::calculate_interest_rates`;

/**
 * -------------------------------------------------------------------------
 * gho_interest_rate_strategy
 * -------------------------------------------------------------------------
 */

// Asset Strategy Configurator
export const strategyDAI = {
  // strategy: rateStrategies_1.rateStrategyStableTwo,
  baseLTVAsCollateral: "7500",
  liquidationThreshold: "8000",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "8",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: true,
};

export const strategyUSDC = {
  // strategy: rateStrategies_1.rateStrategyStableOne,
  baseLTVAsCollateral: "8000",
  liquidationThreshold: "8500",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "8",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: true,
};
export const strategyAAVE = {
  // strategy: rateStrategies_1.rateStrategyVolatileOne,
  baseLTVAsCollateral: "5000",
  liquidationThreshold: "6500",
  liquidationBonus: "11000",
  liquidationProtocolFee: "1000",
  borrowingEnabled: false,
  // stableBorrowRateEnabled: false,
  flashLoanEnabled: false,
  reserveDecimals: "8",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "0",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};

export const strategyWETH = {
  // strategy: rateStrategies_1.rateStrategyVolatileOne,
  baseLTVAsCollateral: "8000",
  liquidationThreshold: "8250",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "8",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};

export const strategyLINK = {
  // strategy: rateStrategies_1.rateStrategyVolatileOne,
  baseLTVAsCollateral: "7000",
  liquidationThreshold: "7500",
  liquidationBonus: "11000",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "18",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "2000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};

export const strategyWBTC = {
  // strategy: rateStrategies_1.rateStrategyVolatileOne,
  baseLTVAsCollateral: "7000",
  liquidationThreshold: "7500",
  liquidationBonus: "11000",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "8",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "2000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: false,
};

export const strategyUSDT = {
  // strategy: rateStrategies_1.rateStrategyStableOne,
  baseLTVAsCollateral: "7500",
  liquidationThreshold: "8000",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "6",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "1000000",
  borrowableIsolation: true,
};

export const strategyEURS = {
  // strategy: rateStrategies_1.rateStrategyStableOne,
  baseLTVAsCollateral: "8000",
  liquidationThreshold: "8500",
  liquidationBonus: "10500",
  liquidationProtocolFee: "1000",
  borrowingEnabled: true,
  // stableBorrowRateEnabled: true,
  flashLoanEnabled: true,
  reserveDecimals: "2",
  // aTokenImpl: types_1.eContractid.AToken,
  reserveFactor: "1000",
  supplyCap: "0",
  borrowCap: "0",
  debtCeiling: "1000000",
  borrowableIsolation: false,
};

// rate Strategy
export const rateStrategyStableTwo = {
  name: "rateStrategyStableTwo",
  optimalUsageRatio: "800000000000000000000000000",
  baseVariableBorrowRate: "0",
  variableRateSlope1: "40000000000000000000000000",
  variableRateSlope2: "750000000000000000000000000",
  stableRateSlope1: "20000000000000000000000000",
  stableRateSlope2: "750000000000000000000000000",
  baseStableRateOffset: "20000000000000000000000000",
  stableRateExcessOffset: "50000000000000000000000000",
  optimalStableToTotalDebtRatio: "200000000000000000000000000",
};
//  base_variable_borrow_rate + variable_rate_slope1 + variable_rate_slope2

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
  /// the outstanding debt borrowed against this asset in isolation mode
  isolation_mode_total_debt: Number;
};
