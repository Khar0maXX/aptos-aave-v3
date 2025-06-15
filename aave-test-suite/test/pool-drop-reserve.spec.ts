import {
  AclClient,
  AptosProvider,
  consts,
  OracleClient,
  PoolClient,
} from "@aave/aave-v3-aptos-ts-sdk";
import { initializeMakeSuite, testEnv } from "../configs/config";

describe("Pool: Drop Reserve", () => {
  let aptosProvider: AptosProvider;
  let poolClient: PoolClient;
  let oracleClient: OracleClient;
  let aclClient: AclClient;

  beforeEach(async () => {
    aptosProvider = AptosProvider.fromEnvs();
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

  it("Drop an asset that is not pool admin", async () => {
    const {
      users: [, , , , user],
    } = testEnv;
    try {
      await poolClient.withSigner(user).dropReserve(user.accountAddress);
    } catch (err) {
      expect(err.toString().includes("pool_configurator: 0x1")).toBe(true);
    }
  });

  it("Drop an asset that is not a listed reserve should fail", async () => {
    try {
      await poolClient.withModuleSigner().dropReserve(consts.ZERO_ADDRESS);
    } catch (err) {
      expect(err.toString().includes("pool_token_logic: 0x4d")).toBe(true);
    }
  });
});
