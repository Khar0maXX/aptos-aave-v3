import { BigNumber } from "@ethersproject/bignumber";
import { ADAI, initializeMakeSuite, testEnv } from "../configs/config";
import {
  AAVE_PROFILES,
  AptosProvider,
  ATokensClient,
  UnderlyingTokensClient,
} from "@aave/aave-v3-aptos-ts-sdk";
import { Ed25519Account } from "@aptos-labs/ts-sdk";

describe("Rescue tokens", () => {
  let aptosProvider: AptosProvider;
  let underlyingTokensClient: UnderlyingTokensClient;
  let aTokensClient: ATokensClient;
  let poolManager: Ed25519Account;

  beforeEach(async () => {
    aptosProvider = AptosProvider.fromEnvs();
    underlyingTokensClient = new UnderlyingTokensClient(
      aptosProvider,
      aptosProvider.getUnderlyingTokensProfileAccount(),
    );
    aTokensClient = new ATokensClient(
      aptosProvider,
      aptosProvider.getPoolProfileAccount(),
    );
    poolManager = aptosProvider.getProfileAccountByName(AAVE_PROFILES.AAVE_POOL);
  });

  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("User tries to rescue tokens from AToken (revert expected)", async () => {
    const {
      aDai,
      users: [rescuer],
    } = testEnv;
    const amount = 1;
    // const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await aTokensClient.withSigner(rescuer).rescueTokens(aDai, rescuer.accountAddress, BigInt(amount), aDaiTokenMetadataAddress);
    } catch (err) {
      expect(err.toString().includes("token_base: 0x1")).toBe(true);
    }
  });

  it("User tries to rescue tokens of underlying from AToken (revert expected)", async () => {
    const {
      dai,
      users: [rescuer],
    } = testEnv;
    const amount = 1;
    // const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await aTokensClient.withSigner(rescuer).rescueTokens(dai, rescuer.accountAddress, BigInt(amount), aDaiTokenMetadataAddress);
    } catch (err) {
      expect(err.toString().includes("token_base: 0x1")).toBe(true);
    }
  });

  it("PoolAdmin tries to rescue tokens of underlying from AToken (revert expected)", async () => {
    const {
      dai,
      aDai,
      users: [rescuer],
    } = testEnv;
    const amount = 1;
    // const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aTokenDaiMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await aTokensClient.withSigner(rescuer).rescueTokens(dai, rescuer.accountAddress, BigInt(amount), aTokenDaiMetadataAddress);
    } catch (err) {
      expect(err.toString().includes("token_base: 0x1")).toBe(true);
    }
  });

  it("PoolAdmin rescues tokens from Pool", async () => {
    const {
      usdc,
      users: [locker],
    } = testEnv;
    const usdcDecimals = Number(await underlyingTokensClient.decimals(usdc));
    const usdcAmount = 10 * 10 ** usdcDecimals;
    // const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(poolManager.accountAddress, ADAI);
    // const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    const aDaiTokenAccAddress = await aTokensClient.getTokenAccountAddress(aDaiTokenMetadataAddress);

    // mint usdc to adai token acc address to simulate a wrongfully sent amount e.g.
    await underlyingTokensClient.mint(aDaiTokenAccAddress, BigInt(usdcAmount), usdc);

    // get the usdc balance of the locker
    const lockerBalanceBefore = await underlyingTokensClient.balanceOf(locker.accountAddress, usdc);
    // get the usdc balance of the Adai acc. address
    const aTokenBalanceBefore = await underlyingTokensClient.balanceOf(aDaiTokenAccAddress, usdc);

    // pool admin tries to rescue the wrongfully received usdc to the aDai Atoken
    expect(await aTokensClient.withSigner(poolManager).rescueTokens(
      usdc,  // amount sent by mistake
      locker.accountAddress, // rescue to
      BigInt(usdcAmount),  // rescue amount
      aDaiTokenMetadataAddress, // received by mistake by the adai token
    ));

    const lockerBalanceAfter = await underlyingTokensClient.balanceOf(locker.accountAddress, usdc);
    expect(BigNumber.from(lockerBalanceBefore).toString()).toBe(
      BigNumber.from(lockerBalanceAfter).sub(usdcAmount).toString(),
    );
    const aTokenBalanceAfter = await underlyingTokensClient.balanceOf(aDaiTokenAccAddress, usdc);

    expect(BigNumber.from(aTokenBalanceBefore).toString()).toBe(
      BigNumber.from(aTokenBalanceAfter).add(usdcAmount).toString(),
    );
  });
});
