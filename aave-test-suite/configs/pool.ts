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
  supplyCap: "100000",
  borrowCap: "0",
  debtCeiling: "0",
  borrowableIsolation: true,
  emode: 0,
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
  emode: 0,
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
  borrowCap: "80000",
  debtCeiling: "0",
  borrowableIsolation: false,
  emode: 0,
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
  emode: 0,
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
  debtCeiling: "100000000",
  borrowableIsolation: true,
  emode: 0,
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
  supplyCap: "200000",
  borrowCap: "100000",
  debtCeiling: "0",
  borrowableIsolation: false,
  emode: 1,
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
  emode: 0,
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
  emode: 0,
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
