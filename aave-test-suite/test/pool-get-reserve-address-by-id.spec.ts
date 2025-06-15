import {
  AclClient,
  AptosProvider,
  CoreClient,
  OracleClient,
  PoolClient,
  UnderlyingTokensClient,
} from "@aave/aave-v3-aptos-ts-sdk";
import { WETH } from "../configs/config";

describe("Pool: getReservesList", () => {
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

  it("User gets address of reserve by id", async () => {
    const wethAddress = await underlyingTokensClient.getMetadataBySymbol(WETH);
    const reserveData = await poolClient.getReserveData(wethAddress);
    const reserveAddress = await poolClient.getReserveAddressById(
      reserveData.id,
    );
    await expect(reserveAddress.toString()).toBe(wethAddress.toString());
  });

  it("User calls `getReservesList` with a wrong id (id > reservesCount)", async () => {
    // MAX_NUMBER_RESERVES is always greater than reservesCount
    const maxNumberOfReserves = await poolClient.getMaxNumberReserves();
    const reserveAddress = await poolClient.getReserveAddressById(
      Number(maxNumberOfReserves) + 1,
    );
    await expect(reserveAddress.toString()).toBe("0x0");
  });
});
