import { BigNumber } from "@ethersproject/bignumber";
import { initializeMakeSuite, testEnv } from "../configs/config";
import { AptosProvider, OracleClient, consts } from "@aave/aave-v3-aptos-ts-sdk";
import { Ed25519Account } from "@aptos-labs/ts-sdk";

describe("AaveOracle", () => {

  let aptosProvider: AptosProvider;
  let oracleManager: Ed25519Account;

  beforeAll(async () => {
    await initializeMakeSuite();
    aptosProvider = AptosProvider.fromEnvs();
    oracleManager = aptosProvider.getOracleProfileAccount();
  });

  it("Get price of asset with no asset source", async () => {
    const { weth } = testEnv;
    const sourcePrice = "100";
    const aptosProvider = AptosProvider.fromEnvs();
    const oracleClient = new OracleClient(aptosProvider, aptosProvider.getOracleProfileAccount());
    await oracleClient.setAssetCustomPrice(weth, BigNumber.from(sourcePrice).toBigInt());

    const newPrice = await oracleClient.getAssetPrice(weth);
    expect(newPrice.toString()).toBe(sourcePrice);
  });

  it("Get price of asset with 0 price but non-zero fallback price", async () => {
    const { weth } = testEnv;
    const fallbackPrice = consts.oneEther.toString();
    const aptosProvider = AptosProvider.fromEnvs();
    const oracleClient = new OracleClient(aptosProvider, aptosProvider.getOracleProfileAccount());
    await oracleClient.setAssetCustomPrice(weth, BigNumber.from(fallbackPrice).toBigInt());

    const newPrice = await oracleClient.getAssetPrice(weth);
    expect(newPrice.toString()).toBe(fallbackPrice);
  });
});
