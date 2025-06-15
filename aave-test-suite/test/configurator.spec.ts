import { AccountAddress } from "@aptos-labs/ts-sdk";
import { initializeMakeSuite, testEnv } from "../configs/config";
import {
  AclClient,
  AptosProvider,
  consts,
  PoolClient,
} from "@aave/aave-v3-aptos-ts-sdk";
import { strategyAAVE } from "../configs/pool";

type ReserveConfigurationValues = {
  reserveDecimals: string;
  baseLTVAsCollateral: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  reserveFactor: string;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  eModeCategory: string;
  borrowCap: string;
  supplyCap: string;
};

const expectReserveConfigurationData = async (
  poolClient: PoolClient,
  asset: AccountAddress,
  values: ReserveConfigurationValues,
) => {
  const reserveConfData = await poolClient.getReserveConfigurationData(asset);
  const isPaused = await poolClient.getPaused(asset);
  // const eModeCategory = await poolClient.getReserveEmodeCategory(asset);
  // const { borrowCap, supplyCap } = await poolClient.getReserveCaps(asset);
  expect(reserveConfData.decimals.toString()).toBe(values.reserveDecimals);
  expect(reserveConfData.isActive).toBe(values.isActive);
  expect(reserveConfData.isFrozen).toBe(values.isFrozen);
  expect(isPaused).toBe(values.isPaused);
};

describe("PoolConfigurator", () => {
  let baseConfigValues: ReserveConfigurationValues;

  let aptosProvider: AptosProvider;
  let poolClient: PoolClient;
  let aclClient: AclClient;

  beforeEach(async () => {
    aptosProvider = AptosProvider.fromEnvs();
    poolClient = new PoolClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
    aclClient = new AclClient(
      aptosProvider,
      aptosProvider.getAclProfileAccount(),
    );

    const {
      reserveDecimals,
      baseLTVAsCollateral,
      liquidationThreshold,
      liquidationBonus,
      reserveFactor,
      borrowingEnabled,
      borrowCap,
      supplyCap,
    } = strategyAAVE;

    baseConfigValues = {
      reserveDecimals,
      baseLTVAsCollateral,
      liquidationThreshold,
      liquidationBonus,
      reserveFactor,
      usageAsCollateralEnabled: true,
      borrowingEnabled,
      isActive: true,
      isFrozen: false,
      isPaused: false,
      eModeCategory: "0",
      borrowCap,
      supplyCap,
    };
  });

  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("InitReserves via AssetListing admin", async () => {
    const { users } = testEnv;
    const assetListingAdmin = users[4];

    const isAssetListingAdmin = await aclClient.isAssetListingAdmin(
      assetListingAdmin.accountAddress,
    );
    if (!isAssetListingAdmin) {
      expect(
        await aclClient.addAssetListingAdmin(assetListingAdmin.accountAddress),
      );
    }
  });

  it("Deactivates the ETH reserve", async () => {
    const { aave } = testEnv;
    await poolClient.setReserveActive(aave, false);
    const reserveConfigurationData =
      await poolClient.getReserveConfigurationData(aave);
    expect(reserveConfigurationData.isActive).toBe(false);
  });

  it("Reactivates the ETH reserve", async () => {
    const { aave } = testEnv;
    await poolClient.setReserveActive(aave, true);
    const reserveConfigurationData =
      await poolClient.getReserveConfigurationData(aave);
    expect(reserveConfigurationData.isActive).toBe(true);
  });

  it("Pauses the ETH reserve by pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReservePaused(aave, true));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isPaused: true,
    });
  });

  it("Unpauses the ETH reserve by pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReservePaused(aave, false));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isPaused: false,
    });
  });

  it("Pauses the ETH reserve by emergency admin", async () => {
    const { aave, emergencyAdmin } = testEnv;
    expect(
      await poolClient.withSigner(emergencyAdmin).setReservePaused(aave, true),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isPaused: true,
    });
  });

  it("Unpauses the ETH reserve by emergency admin", async () => {
    const { aave, emergencyAdmin } = testEnv;
    expect(
      await poolClient.withSigner(emergencyAdmin).setReservePaused(aave, false),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isPaused: false,
    });
  });

  it("Freezes the ETH reserve by Pool Admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReserveFreeze(aave, true));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isFrozen: true,
    });
  });

  it("Unfreezes the ETH reserve by Pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReserveFreeze(aave, false));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isFrozen: false,
    });
  });

  it("Freezes the ETH reserve by Risk Admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(await poolClient.withSigner(riskAdmin).setReserveFreeze(aave, true));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isFrozen: true,
    });
  });

  it("Unfreezes the ETH reserve by Risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient.withSigner(riskAdmin).setReserveFreeze(aave, false),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      isFrozen: false,
    });
  });

  it("Deactivates the ETH reserve for borrowing via pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReserveBorrowing(aave, false));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowingEnabled: false,
    });
  });

  it("Deactivates the ETH reserve for borrowing via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient.withSigner(riskAdmin).setReserveBorrowing(aave, false),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowingEnabled: false,
    });
  });

  it("Activates the ETH reserve for borrowing via pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.setReserveBorrowing(aave, true));

    const reserveData = await poolClient.getReserveData(aave);
    const variableBorrowIndex = reserveData.variableBorrowIndex;
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
    });
    expect(variableBorrowIndex).toBe(BigInt(consts.RAY));
  });

  it("Activates the ETH reserve for borrowing via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient.withSigner(riskAdmin).setReserveBorrowing(aave, true),
    );

    const reserveData = await poolClient.getReserveData(aave);
    const variableBorrowIndex = reserveData.variableBorrowIndex;
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
    });
    expect(variableBorrowIndex).toBe(BigInt(consts.RAY));
  });

  it("Deactivates the ETH reserve as collateral via pool admin", async () => {
    const { aave } = testEnv;
    expect(await poolClient.configureReserveAsCollateral(aave, 0n, 0n, 0n));
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      baseLTVAsCollateral: "0",
      liquidationThreshold: "0",
      liquidationBonus: "0",
      usageAsCollateralEnabled: false,
    });
  });

  it("Activates the ETH reserve as collateral via pool admin", async () => {
    const { aave } = testEnv;
    expect(
      await poolClient.configureReserveAsCollateral(aave, 8000n, 8250n, 10500n),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      baseLTVAsCollateral: "8000",
      liquidationThreshold: "8250",
      liquidationBonus: "10500",
    });
  });

  it("Deactivates the ETH reserve as collateral via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .configureReserveAsCollateral(aave, 0n, 0n, 0n),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      baseLTVAsCollateral: "0",
      liquidationThreshold: "0",
      liquidationBonus: "0",
      usageAsCollateralEnabled: false,
    });
  });

  it("Activates the ETH reserve as collateral via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .configureReserveAsCollateral(aave, 8000n, 8250n, 10500n),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      baseLTVAsCollateral: "8000",
      liquidationThreshold: "8250",
      liquidationBonus: "10500",
    });
  });

  it("Changes the reserve factor of aave via pool admin", async () => {
    const { aave } = testEnv;
    const newReserveFactor = "1000";
    expect(
      await poolClient
        .withModuleSigner()
        .setReserveFactor(aave, BigInt(newReserveFactor)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      reserveFactor: newReserveFactor,
    });
  });

  it("Changes the reserve factor of aave via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    const newReserveFactor = "1000";
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .setReserveFactor(aave, BigInt(newReserveFactor)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      reserveFactor: newReserveFactor,
    });
  });

  it("Updates the reserve factor of aave equal to PERCENTAGE_FACTOR", async () => {
    const { aave } = testEnv;
    const newReserveFactor = "10000";
    expect(
      await poolClient
        .withModuleSigner()
        .setReserveFactor(aave, BigInt(newReserveFactor)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      reserveFactor: newReserveFactor,
    });
  });

  it("Updates the borrowCap of aave via pool admin", async () => {
    const { aave } = testEnv;
    const newBorrowCap = "3000000";
    expect(
      await poolClient
        .withModuleSigner()
        .setBorrowCap(aave, BigInt(newBorrowCap)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowCap: newBorrowCap,
    });
  });

  it("Updates the borrowCap of aave risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    const newBorrowCap = "3000000";
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .setBorrowCap(aave, BigInt(newBorrowCap)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowCap: newBorrowCap,
    });
  });

  it("Updates the supplyCap of aave via pool admin", async () => {
    const { aave } = testEnv;
    const newBorrowCap = "3000000";
    const newSupplyCap = "3000000";
    expect(
      await poolClient
        .withModuleSigner()
        .setSupplyCap(aave, BigInt(newSupplyCap)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowCap: newBorrowCap,
      supplyCap: newSupplyCap,
    });
  });

  it("Updates the supplyCap of aave via risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    const newBorrowCap = "3000000";
    const newSupplyCap = "3000000";
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .setSupplyCap(aave, BigInt(newSupplyCap)),
    );
    await expectReserveConfigurationData(poolClient, aave, {
      ...baseConfigValues,
      borrowCap: newBorrowCap,
      supplyCap: newSupplyCap,
    });
  });

  it("Updates flash loan premiums equal to PERCENTAGE_FACTOR: 10000 toProtocol, 10000 total", async () => {
    const newPremiumTotal = "10000";
    const newPremiumToProtocol = "10000";
    expect(
      await poolClient
        .withModuleSigner()
        .updateFloashloanPremiumTotal(BigInt(newPremiumTotal)),
    );
    expect(
      await poolClient
        .withModuleSigner()
        .updateFloashloanPremiumToProtocol(BigInt(newPremiumToProtocol)),
    );

    const premiumTotal = await poolClient.getFlashloanPremiumTotal();
    const premiumToProtocol = await poolClient.getFlashloanPremiumToProtocol();

    expect(premiumTotal).toBe(BigInt(newPremiumTotal));
    expect(premiumToProtocol).toBe(BigInt(newPremiumToProtocol));
  });

  it("Updates flash loan premiums: 10 toProtocol, 40 total", async () => {
    const newPremiumTotal = "40";
    const newPremiumToProtocol = "10";

    expect(
      await poolClient
        .withModuleSigner()
        .updateFloashloanPremiumTotal(BigInt(newPremiumTotal)),
    );
    expect(
      await poolClient
        .withModuleSigner()
        .updateFloashloanPremiumToProtocol(BigInt(newPremiumToProtocol)),
    );

    const premiumTotal = await poolClient.getFlashloanPremiumTotal();
    const premiumToProtocol = await poolClient.getFlashloanPremiumToProtocol();

    expect(premiumTotal).toBe(BigInt(newPremiumTotal));
    expect(premiumToProtocol).toBe(BigInt(newPremiumToProtocol));
  });

  it("Sets siloed borrowing through the risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    expect(
      await poolClient.withSigner(riskAdmin).setSiloedBorrowing(aave, false),
    );

    const newSiloedBorrowing = await poolClient.getSiloedBorrowing(aave);
    expect(newSiloedBorrowing).toBe(false);
  });

  it("Sets a debt ceiling through the pool admin", async () => {
    const { aave } = testEnv;
    const newDebtCeiling = "10";
    expect(
      await poolClient
        .withModuleSigner()
        .setDebtCeiling(aave, BigInt(newDebtCeiling)),
    );

    const newCeiling = await poolClient.getDebtCeiling(aave);
    expect(newCeiling).toBe(BigInt(newDebtCeiling));
  });

  it("Sets a debt ceiling through the risk admin", async () => {
    const { aave, riskAdmin } = testEnv;
    const newDebtCeiling = "10";
    expect(
      await poolClient
        .withSigner(riskAdmin)
        .setDebtCeiling(aave, BigInt(newDebtCeiling)),
    );
    const newCeiling = await poolClient.getDebtCeiling(aave);
    expect(newCeiling).toBe(BigInt(newDebtCeiling));
  });

  it("Sets a debt ceiling larger than max (revert expected)", async () => {
    const { aave } = testEnv;
    const MAX_VALID_DEBT_CEILING = 1099511627775;
    const debtCeiling = MAX_VALID_DEBT_CEILING + 1;
    const currentCeiling = await poolClient.getDebtCeiling(aave);
    try {
      await poolClient
        .withModuleSigner()
        .setDebtCeiling(aave, BigInt(debtCeiling));
    } catch (err) {
      expect(err.toString().includes("reserve_config: 0x49")).toBe(true);
    }
    const newCeiling = await poolClient.getDebtCeiling(aave);
    expect(newCeiling).toBe(BigInt(currentCeiling));
  });

  it("Read debt ceiling decimals", async () => {
    const { aave } = testEnv;
    const debtCeilingDecimals = await poolClient.getDebtCeilingDecimals();
    expect(debtCeilingDecimals).toBe(BigInt("2"));
  });

  it("Check that the reserves have flashloans enabled", async () => {
    const { aave, usdc, dai } = testEnv;
    const aaveFlashLoanEnabled = await poolClient.getFlashloanEnabled(aave);
    expect(aaveFlashLoanEnabled).toBe(false);

    const usdcFlashLoanEnabled = await poolClient.getFlashloanEnabled(usdc);
    expect(usdcFlashLoanEnabled).toBe(true);

    const daiFlashLoanEnabled = await poolClient.getFlashloanEnabled(dai);
    expect(daiFlashLoanEnabled).toBe(true);
  });

  it("Disable aave flashloans", async () => {
    const { aave } = testEnv;
    expect(
      await poolClient.withModuleSigner().setReserveFlashLoaning(aave, false),
    );
    const aaveFlashLoanEnabled = await poolClient.getFlashloanEnabled(aave);
    expect(aaveFlashLoanEnabled).toBe(false);
  });
});
