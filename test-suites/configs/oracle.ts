import { Account, MoveFunctionId } from "@aptos-labs/ts-sdk";
import { AptosProvider } from "../wrappers/aptosProvider";

// Resources Admin Account
const aptosProvider = AptosProvider.fromEnvs();
export const OracleManager = Account.fromPrivateKey({
  privateKey: aptosProvider.getProfileAccountPrivateKeyByName("aave_oracle"),
});
export const OracleManagerAccountAddress = OracleManager.accountAddress.toString();

// Resource Func Addr
export const GetAssetPriceFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::get_asset_price`;
export const GetAssetsPricesFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::get_assets_prices`;
export const SetAssetFeedIdFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::set_asset_feed_id`;
export const SetAssetCustomPrice: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::set_asset_custom_price`;
export const BatchSetAssetFeedIdsFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::batch_set_asset_feed_ids`;
export const RemoveAssetFeedIdFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::remove_asset_feed_id`;
export const RemoveAssetFeedIdsFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle::batch_remove_asset_feed_ids`;
export const GetOracleResourceAccountFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle_base::get_oracle_resource_account`;
export const GetOracleAddressFuncAddr: MoveFunctionId = `${OracleManagerAccountAddress}::oracle_base::oracle_address`;

// Mock Account
