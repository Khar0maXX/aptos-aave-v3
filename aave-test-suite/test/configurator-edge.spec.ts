import { BigNumber } from "@ethersproject/bignumber";
import { initializeMakeSuite, testEnv } from "../configs/config";
import {
  AptosProvider,
  consts,
  PoolClient,
} from "@aave/aave-v3-aptos-ts-sdk";

describe("PoolConfigurator: Edge cases", () => {
  let aptosProvider: AptosProvider;
  let poolClient: PoolClient;

  beforeAll(async () => {
    await initializeMakeSuite();
    aptosProvider = AptosProvider.fromEnvs();
    poolClient = new PoolClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
  });

  it("ReserveConfiguration setLiquidationBonus() threshold > MAX_VALID_LIQUIDATION_THRESHOLD", async () => {
    const { dai } = testEnv;
    try {
      await poolClient.configureReserveAsCollateral(
        dai,
        BigInt(5),
        BigInt(10),
        BigInt(65535 + 1),
      );
    } catch (err) {
      expect(err.toString().includes("reserve_config: 0x41")).toBe(true);
    }
  });

  it("PoolConfigurator setReserveFactor() reserveFactor > PERCENTAGE_FACTOR (revert expected)", async () => {
    const { dai } = testEnv;
    const invalidReserveFactor = 20000;
    try {
      await poolClient.setReserveFactor(dai, BigInt(invalidReserveFactor));
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x43")).toBe(true);
    }
  });

  it("ReserveConfiguration setReserveFactor() reserveFactor > MAX_VALID_RESERVE_FACTOR", async () => {
    const { dai } = testEnv;
    const invalidReserveFactor = 65536;
    try {
      await poolClient.setReserveFactor(dai, BigInt(invalidReserveFactor));
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x43")).toBe(true);
    }
  });

  it("PoolConfigurator configureReserveAsCollateral() ltv > liquidationThreshold", async () => {
    const { dai } = testEnv;
    const { liquidationThreshold, liquidationBonus } =
      await poolClient.getReserveConfigurationData(dai);
    try {
      await poolClient.configureReserveAsCollateral(
        dai,
        BigInt(65535 + 1),
        liquidationThreshold,
        liquidationBonus,
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x14")).toBe(true);
    }
  });

  it("PoolConfigurator configureReserveAsCollateral() liquidationBonus < 10000", async () => {
    const { dai } = testEnv;
    const { ltv, liquidationThreshold } =
      await poolClient.getReserveConfigurationData(dai);

    try {
      await poolClient.configureReserveAsCollateral(
        dai,
        ltv,
        liquidationThreshold,
        BigInt(10000),
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x14")).toBe(true);
    }
  });

  it("PoolConfigurator configureReserveAsCollateral() liquidationThreshold.percentMul(liquidationBonus) > PercentageMath.PERCENTAGE_FACTOR", async () => {
    const { dai } = testEnv;

    try {
      await poolClient.configureReserveAsCollateral(
        dai,
        BigInt(10001),
        BigInt(10001),
        BigInt(10001),
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x14")).toBe(true);
    }
  });

  it("PoolConfigurator configureReserveAsCollateral() liquidationThreshold == 0 && liquidationBonus > 0", async () => {
    const { dai } = testEnv;

    try {
      await poolClient.configureReserveAsCollateral(
        dai,
        BigInt(0),
        BigInt(0),
        BigInt(15000),
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x14")).toBe(true);
    }
  });

  it("Tries to update flashloan premium total > PERCENTAGE_FACTOR (revert expected)", async () => {
    const newPremiumTotal = BigInt(10001);

    try {
      await poolClient.updateFloashloanPremiumTotal(newPremiumTotal);
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x13")).toBe(true);
    }
  });

  it("Tries to update flashloan premium to protocol > PERCENTAGE_FACTOR (revert expected)", async () => {
    const newPremiumToProtocol = BigInt(10001);

    try {
      await poolClient.updateFloashloanPremiumToProtocol(newPremiumToProtocol);
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x13")).toBe(true);
    }
  });

  it("Tries to update borrowCap > MAX_BORROW_CAP (revert expected)", async () => {
    const { weth } = testEnv;

    try {
      await poolClient.setBorrowCap(
        weth,
        BigNumber.from(consts.MAX_BORROW_CAP).add(1).toBigInt(),
      );
    } catch (err) {
      expect(err.toString().includes("reserve_config: 0x44")).toBe(true);
    }
  });

  it("Tries to update supplyCap > MAX_SUPPLY_CAP (revert expected)", async () => {
    const { weth } = testEnv;

    try {
      await poolClient.setSupplyCap(
        weth,
        BigNumber.from(consts.MAX_SUPPLY_CAP).add(1).toBigInt(),
      );
    } catch (err) {
      expect(err.toString().includes("reserve_config: 0x45")).toBe(true);
    }
  });

  it("Tries to set borrowCap of MAX_BORROW_CAP an unlisted asset", async () => {
    const { users } = testEnv;

    try {
      await poolClient.setBorrowCap(users[5].accountAddress, BigInt(10));
    } catch (err) {
      expect(err.toString().includes("pool: 0x52")).toBe(true);
    }
  });

  it("Tries to add a category with id 0 (revert expected)", async () => {
    try {
      await poolClient.setEmodeCategory(
        0,
        9800,
        9800,
        10100,
        "INVALID_ID_CATEGORY",
      );
    } catch (err) {
      expect(err.toString().includes("emode_logic: 0x10")).toBe(true);
    }
  });

  it("Tries to add an eMode category with ltv > liquidation threshold (revert expected)", async () => {
    try {
      await poolClient.setEmodeCategory(
        16,
        9900,
        9800,
        10100,
        "STABLECOINS",
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x15")).toBe(true);
    }
  });

  it("Tries to add an eMode category with no liquidation bonus (revert expected)", async () => {
    try {
      await poolClient.setEmodeCategory(
        16,
        9800,
        9800,
        10000,
        "STABLECOINS",
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x15")).toBe(true);
    }
  });

  it("Tries to add an eMode category with too large liquidation bonus (revert expected)", async () => {
    try {
      await poolClient.setEmodeCategory(
        16,
        9800,
        9800,
        11000,
        "STABLECOINS",
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x15")).toBe(true);
    }
  });

  it("Tries to add an eMode category with liquidation threshold > 1 (revert expected)", async () => {
    try {
      await poolClient.setEmodeCategory(
        16,
        9800,
        10100,
        10100,
        "STABLECOINS",
      );
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x15")).toBe(true);
    }
  });

  it("Tries to set DAI eMode category to undefined category (revert expected)", async () => {
    const { dai } = testEnv;

    try {
      await poolClient.setAssetEmodeCategory(dai, 100);
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x11")).toBe(true);
    }
  });

  it("Tries to set DAI eMode category to category with too low LT (revert expected)", async () => {
    const { aave } = testEnv;
    const { ltv, liquidationThreshold } = await poolClient.getReserveConfigurationData(aave);
    try {
      await poolClient.setEmodeCategory(
        100,
        Number(ltv),
        Number(liquidationThreshold - 1n),
        10100,
        "LT_TOO_LOW_FOR_DAI",
      );
      await poolClient.setAssetEmodeCategory(aave, 100);
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x11")).toBe(true);
    }
  });
});
