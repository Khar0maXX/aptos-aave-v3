import { getMetadataAddress, UnderlyingGetMetadataBySymbolFuncAddr, WETH } from "../configs/tokens";
import { View } from "../helpers/helper";
import { aptos } from "../configs/common";
import {
  PoolGetReserveAddressByIdFuncAddr,
  PoolGetReserveDataFuncAddr,
  PoolGetReserveId,
  PoolMaxNumberReservesFuncAddr,
} from "../configs/pool";
import {Object} from "../helpers/interfaces";
import {AccountAddress} from "@aptos-labs/ts-sdk";

describe("Pool: getReservesList", () => {
  it("User gets address of reserve by id", async () => {
    const wethAddress = await getMetadataAddress(UnderlyingGetMetadataBySymbolFuncAddr, WETH);

    const [resp] = await View(aptos, PoolGetReserveDataFuncAddr, [wethAddress]);
    const reserveDataObject = AccountAddress.fromString((resp as Object).inner);
    const [id] = await View(aptos, PoolGetReserveId, [reserveDataObject]);
    const [reserveAddress] = await View(aptos, PoolGetReserveAddressByIdFuncAddr, [id.toString()]);
    expect(reserveAddress.toString()).toBe(wethAddress.toString());
  });

  it("User calls `getReservesList` with a wrong id (id > reservesCount)", async () => {
    // MAX_NUMBER_RESERVES is always greater than reservesCount
    const [maxNumberOfReserves] = await View(aptos, PoolMaxNumberReservesFuncAddr, []);

    const [reserveAddress] = await View(aptos, PoolGetReserveAddressByIdFuncAddr, [
      ((maxNumberOfReserves as number) + 1).toString(),
    ]);

    await expect(reserveAddress).toBe("0x0");
  });
});
