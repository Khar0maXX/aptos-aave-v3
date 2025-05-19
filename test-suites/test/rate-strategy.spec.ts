import { parseUnits } from "ethers";
import "../helpers/wadraymath";
import { BigNumber } from "@ethersproject/bignumber";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { PoolManager, rateStrategyStableTwo, strategyDAI } from "../configs/pool";
import { ADAI, ATokenManager, DAI, UnderlyingManager } from "../configs/tokens";
import { AptosProvider } from "../wrappers/aptosProvider";
import { ATokensClient } from "../clients/aTokensClient";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import { DefaultInterestRateStrategyClient } from "../clients/defaultInterestRateStrategyClient";
import {PoolClient} from "../clients/poolClient";
import {rayToBps} from "../helpers/common";

describe("InterestRateStrategy", () => {
  let daiAddress: AccountAddress;
  let aDaiAddress: AccountAddress;
  const aptosProvider = AptosProvider.fromEnvs();
  let poolClient: PoolClient;
  let aTokensClient: ATokensClient;
  let underlyingTokensClient: UnderlyingTokensClient;
  let defInterestStrategyClient: DefaultInterestRateStrategyClient;

  beforeAll(async () => {
    aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);
    defInterestStrategyClient = new DefaultInterestRateStrategyClient(aptosProvider, PoolManager);
    poolClient = new PoolClient(aptosProvider, PoolManager);
    daiAddress = await underlyingTokensClient.getMetadataBySymbol(DAI);
    aDaiAddress = await aTokensClient.getMetadataBySymbol(ADAI);
  });

  it("Checks getters", async () => {
    const optimalUsageRatio = await defInterestStrategyClient.getOptimalUsageRatio(daiAddress);
    expect(optimalUsageRatio.toString()).toBe(rateStrategyStableTwo.optimalUsageRatio);

    const baseVariableBorrowRate = await defInterestStrategyClient.getBaseVariableBorrowRate(daiAddress);
    expect(baseVariableBorrowRate.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate).toString(),
    );

    const variableRateSlope1 = await defInterestStrategyClient.getVariableRateSlope1(daiAddress);
    expect(variableRateSlope1.toString()).toBe(BigNumber.from(rateStrategyStableTwo.variableRateSlope1).toString());

    const variableRateSlope2 = await defInterestStrategyClient.getVariableRateSlope2(daiAddress);
    expect(variableRateSlope2.toString()).toBe(BigNumber.from(rateStrategyStableTwo.variableRateSlope2).toString());

    const maxVariableBorrowRate = await defInterestStrategyClient.getMaxVariableBorrowRate(daiAddress);
    expect(maxVariableBorrowRate.toString()).toBe(
      BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)
        .add(BigNumber.from(rateStrategyStableTwo.variableRateSlope1))
        .add(BigNumber.from(rateStrategyStableTwo.variableRateSlope2))
        .toString(),
    );
  });

  it("Checks rates at 0% usage ratio, empty reserve", async () => {
    const { currentLiquidityRate, currentVariableBorrowRate } = await defInterestStrategyClient.calculateInterestRates(
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(strategyDAI.reserveFactor),
      daiAddress,
      BigNumber.from(0),
    );

    expect(currentLiquidityRate.toString()).toBe("0");
    expect(currentVariableBorrowRate.toString()).toBe("0");
  });

  it("Deploy an interest rate strategy with optimalUsageRatio out of range (expect revert)", async () => {
    try {
      await poolClient.updateInterestRateStrategy(
          daiAddress,
          BigNumber.from(parseUnits("1.0", 28)),
          rayToBps(BigNumber.from(rateStrategyStableTwo.baseVariableBorrowRate)),
          rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope1)),
          rayToBps(BigNumber.from(rateStrategyStableTwo.variableRateSlope2)),
      );
    } catch (err) {
      expect(err.toString().includes("default_reserve_interest_rate_strategy: 0x53")).toBe(true);
    }
  });
});
