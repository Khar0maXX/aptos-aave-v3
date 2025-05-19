import { BigNumber } from "@ethersproject/bignumber";
import { initializeMakeSuite, testEnv } from "../configs/config";
import { Transaction, View } from "../helpers/helper";
import { aptos } from "../configs/common";
import { PoolManager } from "../configs/pool";
import {
  ADAI,
  aptosProvider,
  ATokenManager,
  ATokenRescueTokensFuncAddr,
  getDecimals,
  UnderlyingBalanceOfFuncAddr,
  UnderlyingDecimalsFuncAddr,
  UnderlyingManager,
  UnderlyingMintFuncAddr,
} from "../configs/tokens";
import { ATokensClient } from "../clients/aTokensClient";

describe("Rescue tokens", () => {
  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("User tries to rescue tokens from AToken (revert expected)", async () => {
    const {
      aDai,
      users: [rescuer],
    } = testEnv;
    const amount = 1;
    const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await Transaction(aptos, rescuer, ATokenRescueTokensFuncAddr, [aDai, rescuer.accountAddress.toString(), amount, aDaiTokenMetadataAddress]);
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
    const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await Transaction(aptos, rescuer, ATokenRescueTokensFuncAddr, [dai, rescuer.accountAddress.toString(), amount, aDaiTokenMetadataAddress]);
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
    const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aTokenDaiMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    try {
      await Transaction(aptos, PoolManager, ATokenRescueTokensFuncAddr, [
        dai,
        rescuer.accountAddress.toString(),
        amount,
        aTokenDaiMetadataAddress,
      ]);
    } catch (err) {
      expect(err.toString().includes("a_token_factory: 0x55")).toBe(true);
    }
  });

  it("PoolAdmin rescues tokens from Pool", async () => {
    const {
      usdc,
      users: [locker],
    } = testEnv;
    const usdcDecimals = await getDecimals(UnderlyingDecimalsFuncAddr, usdc);
    const usdcAmount = 10 * 10 ** usdcDecimals;
    const aTokensClient = new ATokensClient(aptosProvider, ATokenManager);
    const aDaiTokenMetadataAddress = await aTokensClient.assetMetadata(ADAI);
    const aDaiTokenAccAddress = await aTokensClient.getTokenAccountAddress(aDaiTokenMetadataAddress);

    // mint usdc to adai token acc address to simulate a wrongfully sent amount e.g.
    await Transaction(aptos, UnderlyingManager, UnderlyingMintFuncAddr, [aDaiTokenAccAddress, usdcAmount, usdc]);

    // get the usdc balance of the locker
    const [lockerBalanceBefore] = await View(aptos, UnderlyingBalanceOfFuncAddr, [
      locker.accountAddress.toString(),
      usdc,
    ]);
    // get the usdc balance of the Adai acc. address
    const [aTokenBalanceBefore] = await View(aptos, UnderlyingBalanceOfFuncAddr, [
      aDaiTokenAccAddress,
      usdc,
    ]);

    // pool admin tries to rescue the wrongfully received usdc to the aDai Atoken
    expect(await Transaction(aptos, PoolManager, ATokenRescueTokensFuncAddr, [
      usdc, // amount sent by mistake
      locker.accountAddress.toString(), // rescue to
      usdcAmount, // rescue amount
      aDaiTokenMetadataAddress, // received by mistake by the adai token
    ]));

    const [lockerBalanceAfter] = await View(aptos, UnderlyingBalanceOfFuncAddr, [
      locker.accountAddress.toString(),
      usdc,
    ]);
    expect(BigNumber.from(lockerBalanceBefore).toString()).toBe(
      BigNumber.from(lockerBalanceAfter).sub(usdcAmount).toString(),
    );

    const [aTokenBalanceAfter] = await View(aptos, UnderlyingBalanceOfFuncAddr, [
      aDaiTokenAccAddress,
      usdc,
    ]);
    expect(BigNumber.from(aTokenBalanceBefore).toString()).toBe(
      BigNumber.from(aTokenBalanceAfter).add(usdcAmount).toString(),
    );
  });
});
