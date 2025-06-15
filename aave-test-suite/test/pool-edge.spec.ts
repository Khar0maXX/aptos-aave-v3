import { initializeMakeSuite, testEnv } from "../configs/config";
import {
  AclClient,
  AptosProvider,
  consts,
  CoreClient,
  OracleClient,
  PoolClient,
  UnderlyingTokensClient,
} from "@aave/aave-v3-aptos-ts-sdk";

describe("Pool: Edge cases", () => {
  const MAX_NUMBER_RESERVES = 128;

  let aptosProvider: AptosProvider;
  let coreClient: CoreClient;
  let underlyingTokensClient: UnderlyingTokensClient;
  let poolClient: PoolClient;
  let oracleClient: OracleClient;
  let aclClient: AclClient;

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
    oracleClient = new OracleClient(
      aptosProvider,
      aptosProvider.getOracleProfileAccount(),
    );
    aclClient = new AclClient(
      aptosProvider,
      aptosProvider.getOracleProfileAccount(),
    );
  });

  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("Check initialization", async () => {
    const maxNumberReserves = await poolClient.getMaxNumberReserves();
    expect(maxNumberReserves.toString()).toBe(MAX_NUMBER_RESERVES.toString());
  });

  it("Activates the zero address reserve for borrowing via pool admin (expect revert)", async () => {
    try {
      await poolClient
        .withModuleSigner()
        .setReserveBorrowing(consts.ZERO_ADDRESS, true);
    } catch (err) {
      expect(err.toString().includes("pool: 0x52")).toBe(true);
    }
  });
});
