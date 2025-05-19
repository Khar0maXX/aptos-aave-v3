import { initializeMakeSuite, testEnv } from "../configs/config";
import { Transaction, View } from "../helpers/helper";
import { aptos } from "../configs/common";
import {
  PoolConfiguratorSetReserveBorrowingFuncAddr,
  PoolManager,
  PoolMaxNumberReservesFuncAddr,
} from "../configs/pool";
import { FinalizeTransferFuncAddr } from "../configs/supplyBorrow";
import { ZERO_ADDRESS } from "../helpers/constants";

describe("Pool: Edge cases", () => {
  const MAX_NUMBER_RESERVES = 128;

  beforeAll(async () => {
    await initializeMakeSuite();
  });

  it("Check initialization", async () => {
    const [maxNumberReserves] = await View(aptos, PoolMaxNumberReservesFuncAddr, []);
    expect(maxNumberReserves.toString()).toBe(MAX_NUMBER_RESERVES.toString());
  });

  it("Activates the zero address reserve for borrowing via pool admin (expect revert)", async () => {
    try {
      await Transaction(aptos, PoolManager, PoolConfiguratorSetReserveBorrowingFuncAddr, [ZERO_ADDRESS, true]);
    } catch (err) {
      expect(err.toString().includes("pool: 0x52")).toBe(true);
    }
  });
});
