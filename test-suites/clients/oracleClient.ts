import { AccountAddress, CommittedTransactionResponse, EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from "@aptos-labs/ts-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { AptosContractWrapperBaseClass } from "./baseClass";
import { mapToBN } from "../helpers/contractHelper";
import {
  GetAssetPriceFuncAddr,
  GetAssetsPricesFuncAddr,
  SetAssetFeedIdFuncAddr,
  BatchSetAssetFeedIdsFuncAddr,
  RemoveAssetFeedIdFuncAddr,
  RemoveAssetFeedIdsFuncAddr,
  GetOracleResourceAccountFuncAddr,
  GetOracleAddressFuncAddr,
  SetAssetCustomPrice,
} from "../configs/oracle";

export class OracleClient extends AptosContractWrapperBaseClass {

  public async getAssetPrice(asset: AccountAddress): Promise<BigNumber> {
    const [resp] = (await this.callViewMethod(GetAssetPriceFuncAddr, [asset])).map(mapToBN);
    return resp;
  }

  public async getAssetsPrices(assets: Array<AccountAddress>): Promise<Array<BigNumber>> {
    return ((await this.callViewMethod(GetAssetsPricesFuncAddr, [assets])) as Array<any>).map((item) =>
      mapToBN(item)
    )
  }

  public async setAssetFeedId(asset: AccountAddress, feedId: Uint8Array): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(SetAssetFeedIdFuncAddr, [asset, feedId]);
  }

  public async setAssetCustomPrice(asset: AccountAddress, customPrice: BigNumber): Promise<CommittedTransactionResponse> {
    const args: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> = [
      asset,
      customPrice.toString(),
    ];
    return this.sendTxAndAwaitResponse(SetAssetCustomPrice, args);
  }

  public async batchSetAssetFeedIds(assets: Array<AccountAddress>, feedIds: Array<Uint8Array>): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(BatchSetAssetFeedIdsFuncAddr, [assets, feedIds]);
  }

  public async removeAssetFeedId(asset: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(RemoveAssetFeedIdFuncAddr, [asset]);
  }

  public async batchRemoveAssetFeedIds(assets: Array<AccountAddress>): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(RemoveAssetFeedIdsFuncAddr, [assets]);
  }

  public async getOracleResourceAccount(): Promise<AccountAddress> {
    const [resp] = (await this.callViewMethod(GetOracleResourceAccountFuncAddr, [])).map((item) =>
      AccountAddress.fromString(item as string),
    );
    return resp;
  }

  public async getOracleAddress(): Promise<AccountAddress> {
    const [resp] = (await this.callViewMethod(GetOracleAddressFuncAddr, [])).map((item) =>
      AccountAddress.fromString(item as string),
    );
    return resp;
  }

}
