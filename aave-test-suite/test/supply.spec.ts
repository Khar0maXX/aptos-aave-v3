import { BigNumber } from "@ethersproject/bignumber";
import { initializeMakeSuite, testEnv } from "../configs/config";
import {
  AptosProvider,
  consts,
  CoreClient,
  PoolClient,
  UnderlyingTokensClient,
  ATokensClient,
} from "@aave/aave-v3-aptos-ts-sdk";

describe("Supply Unit Test", () => {
  let aptosProvider: AptosProvider;
  let coreClient: CoreClient;
  let underlyingTokensClient: UnderlyingTokensClient;
  let poolClient: PoolClient;
  let aTokensClient: ATokensClient;

  beforeEach(async () => {
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
    aTokensClient = new ATokensClient(
      aptosProvider,
      aptosProvider.getOracleProfileAccount(),
    );
  });

  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("validateDeposit() when amount == 0 (revert expected)", async () => {
    const { users, dai } = testEnv;
    const user = users[0];

    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const daiDepositAmount = 1000 * 10 ** daiDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(daiDepositAmount), dai);

    try {
      await coreClient
        .withSigner(user)
        .supply(dai, 0n, user.accountAddress, consts.AAVE_REFERRAL);
    } catch (err) {
      expect(err.toString().includes("validation_logic: 0x1a")).toBe(true);
    }
  });

  it("validateDeposit() when reserve is not active (revert expected)", async () => {
    const { users, aave } = testEnv;
    const user = users[0];

    const { isActive: isActiveBefore } =
      await poolClient.getReserveConfigurationData(aave);
    expect(isActiveBefore).toBe(true);

    await poolClient.withModuleSigner().setReserveActive(aave, false);

    const { isActive: isActiveAfter } =
      await poolClient.getReserveConfigurationData(aave);
    expect(isActiveAfter).toBe(false);

    const aaveDecimals = Number(await underlyingTokensClient.decimals(aave));
    const aaveDepositAmount = 1000 * 10 ** aaveDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(aaveDepositAmount), aave);

    try {
      await coreClient
        .withSigner(user)
        .supply(
          aave,
          BigInt(aaveDepositAmount),
          user.accountAddress,
          consts.AAVE_REFERRAL,
        );
    } catch (err) {
      expect(err.toString().includes("validation_logic: 0x1b")).toBe(true);
    }

    await poolClient.withModuleSigner().setReserveActive(aave, true);
  });

  it("validateDeposit() when reserve is frozen (revert expected)", async () => {
    const { users, dai } = testEnv;
    const user = users[0];

    await poolClient.withModuleSigner().setReserveFreeze(dai, true);

    const { isFrozen: isFrozenAfter } =
      await poolClient.getReserveConfigurationData(dai);
    expect(isFrozenAfter).toBe(true);

    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const daiDepositAmount = 1000 * 10 ** daiDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(daiDepositAmount), dai);

    try {
      await coreClient
        .withSigner(user)
        .supply(
          dai,
          BigInt(daiDepositAmount),
          user.accountAddress,
          consts.AAVE_REFERRAL,
        );
    } catch (err) {
      expect(err.toString().includes("validation_logic: 0x1c")).toBe(true);
    }
    await poolClient.withModuleSigner().setReserveFreeze(dai, false);
  });

  it("validateDeposit() when reserve is paused (revert expected)", async () => {
    const { users, dai } = testEnv;
    const user = users[0];

    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const daiDepositAmount = 1000 * 10 ** daiDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(daiDepositAmount), dai);

    const user1 = users[1];
    await poolClient.withSigner(user1).setReservePaused(dai, true);

    try {
      await coreClient
        .withSigner(user)
        .supply(
          dai,
          BigInt(daiDepositAmount),
          user.accountAddress,
          consts.AAVE_REFERRAL,
        );
    } catch (err) {
      // console.log("err:", err.toString());
      expect(err.toString().includes("validation_logic: 0x1d")).toBe(true);
    }

    await poolClient.withSigner(user1).setReservePaused(dai, false);
  });

  it("Tries to supply 1001 DAI  (> SUPPLY_CAP) 1 unit above the limit", async () => {
    const { users, dai } = testEnv;
    const user = users[0];

    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const daiDepositAmount = 1001 * 10 ** daiDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(daiDepositAmount), dai);

    const newCap = 1000;
    await poolClient.withModuleSigner().setSupplyCap(dai, BigInt(newCap));

    try {
      await coreClient
        .withSigner(user)
        .supply(
          dai,
          BigInt(daiDepositAmount),
          user.accountAddress,
          consts.AAVE_REFERRAL,
        );
    } catch (err) {
      expect(err.toString().includes("validation_logic: 0x33")).toBe(true);
    }

    await poolClient.withModuleSigner().setSupplyCap(dai, BigInt(0));
  });

  it("User 0 deposits 100 DAI ", async () => {
    const { users, dai, aDai } = testEnv;
    const user = users[0];
    // console.log("user:", user.accountAddress.toString());

    const aTokenResourceAccountAddress =
      await aTokensClient.getTokenAccountAddress(aDai);

    const aTokenAccountBalanceBefore = await underlyingTokensClient.balanceOf(
      aTokenResourceAccountAddress,
      dai,
    );

    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const daiDepositAmount = 100 * 10 ** daiDecimals;

    await underlyingTokensClient
      .withModuleSigner()
      .mint(user.accountAddress, BigInt(daiDepositAmount), dai);

    await coreClient
      .withSigner(user)
      .supply(
        dai,
        BigInt(daiDepositAmount),
        user.accountAddress,
        consts.AAVE_REFERRAL,
      );

    const aTokenAccountBalanceAfter = await underlyingTokensClient.balanceOf(
      aTokenResourceAccountAddress,
      dai,
    );

    const aTokenAccountBalance = BigNumber.from(aTokenAccountBalanceBefore)
      .add(daiDepositAmount)
      .toString();
    expect(BigNumber.from(aTokenAccountBalanceAfter).toString()).toBe(
      aTokenAccountBalance,
    );
  });

  it("User 1 deposits 10 Dai, 10 USDC, user 2 deposits 7 WETH", async () => {
    const {
      dai,
      usdc,
      weth,
      users: [user1, user2],
    } = testEnv;
    const daiDecimals = Number(await underlyingTokensClient.decimals(dai));
    const usdcDecimals = Number(await underlyingTokensClient.decimals(usdc));
    const wethDecimals = Number(await underlyingTokensClient.decimals(weth));

    const daiAmount = 10 * 10 ** daiDecimals;
    const usdcAmount = 10 * 10 ** usdcDecimals;
    const wethAmount = 7 * 10 ** wethDecimals;

    // mint dai
    await underlyingTokensClient
      .withModuleSigner()
      .mint(user2.accountAddress, BigInt(daiAmount), dai);

    // mint usdc
    await underlyingTokensClient
      .withModuleSigner()
      .mint(user1.accountAddress, BigInt(usdcAmount), usdc);

    // mint weth
    await underlyingTokensClient
      .withModuleSigner()
      .mint(user2.accountAddress, BigInt(wethAmount), weth);

    // deposit dai
    await coreClient
      .withSigner(user2)
      .supply(
        dai,
        BigInt(daiAmount),
        user2.accountAddress,
        consts.AAVE_REFERRAL,
      );

    // deposit usdc
    await coreClient
      .withSigner(user1)
      .supply(
        usdc,
        BigInt(usdcAmount),
        user1.accountAddress,
        consts.AAVE_REFERRAL,
      );

    // deposit weth
    await coreClient
      .withSigner(user2)
      .supply(
        weth,
        BigInt(wethAmount),
        user2.accountAddress,
        consts.AAVE_REFERRAL,
      );
  });
});
