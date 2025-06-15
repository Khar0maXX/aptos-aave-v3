import { parseUnits } from "ethers";
import "../helpers/wadraymath";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import {
  AptosProvider,
  CoreClient,
  OracleClient,
  PoolClient,
  UnderlyingTokensClient,
  ATokensClient,
  InterestRateClient,
} from "@aave/aave-v3-aptos-ts-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { ADAI, DAI } from "../configs/config";
import { rateStrategyStableTwo, strategyDAI } from "../configs/pool";
import { rayToBps } from "../helpers/utils";

describe("InterestRateStrategy", () => {
  let aptosProvider: AptosProvider;
  let coreClient: CoreClient;
  let underlyingTokensClient: UnderlyingTokensClient;
  let poolClient: PoolClient;
  let oracleClient: OracleClient;
  let aTokensClient: ATokensClient;
  let defInterestStrategyClient: InterestRateClient;
  let daiAddress: AccountAddress;
  let aDaiAddress: AccountAddress;

  beforeAll(async () => {
    aptosProvider = AptosProvider.fromEnvs();
    coreClient = new CoreClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
    underlyingTokensClient = new UnderlyingTokensClient(
      aptosProvider,
      aptosProvider.getUnderlyingTokensProfileAccount(),
    );
    poolClient = new PoolClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
    oracleClient = new OracleClient(
      aptosProvider,
      aptosProvider.getOracleProfileAccount(),
    );
    aTokensClient = new ATokensClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
    defInterestStrategyClient = new InterestRateClient(aptosProvider, aptosProvider.getPoolProfileAccount());
    daiAddress = await underlyingTokensClient.getMetadataBySymbol(DAI);
    aDaiAddress = await aTokensClient.getMetadataBySymbol(ADAI);
  });

  it("Checks getters", async () => {
    const optimalUsageRatio = await defInterestStrategyClient.getOptimalUsageRatio(daiAddress);
    expect(optimalUsageRatio.toString()).toBe(
      rateStrategyStableTwo.optimalUsageRatio,
    );

    const baseVariableBorrowRate =
      await defInterestStrategyClient.getBaseVariableBorrowRate(daiAddress);
    expect(baseVariableBorrowRate.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate).toString(),
    );

    const variableRateSlope1 =
      await defInterestStrategyClient.getVariableRateSlope1(daiAddress);
    expect(variableRateSlope1.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.variableRateSlope1).toString(),
    );

    const variableRateSlope2 =
      await defInterestStrategyClient.getVariableRateSlope2(daiAddress);
    expect(variableRateSlope2.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.variableRateSlope2).toString(),
    );

    const maxVariableBorrowRate =
      await defInterestStrategyClient.getMaxVariableBorrowRate(daiAddress);
    expect(maxVariableBorrowRate.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)
        .add(BigNumber.from(rateStrategyStableTwo.variableRateSlope1))
        .add(BigNumber.from(rateStrategyStableTwo.variableRateSlope2))
        .toString(),
    );
  });

  it("Checks rates at 0% usage ratio, empty reserve", async () => {
    const { currentLiquidityRate, currentVariableBorrowRate } =
      await defInterestStrategyClient.calculateInterestRates(
        0n,
        0n,
        0n,
        0n,
        BigInt(strategyDAI.reserveFactor),
        daiAddress,
        0n,
      );
    expect(currentLiquidityRate.toString()).toBe("0");
    expect(currentVariableBorrowRate.toString()).toBe("0");
  });

  it("Deploy an interest rate strategy with optimalUsageRatio out of range (expect revert)", async () => {
    try {
      await poolClient.updateInterestRateStrategy(
          daiAddress,
          BigNumber.from(parseUnits("1.0", 28)).toBigInt(),
          rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)).toBigInt(),
          rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)).toBigInt(),
          rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)).toBigInt(),
      );
    } catch (err) {
      expect(
        err.toString().includes("default_reserve_interest_rate_strategy: 0x53"),
      ).toBe(true);
    }
  });
});
