/* eslint-disable no-console */
import { ATokenManager, UnderlyingManager, VariableManager } from "../configs/tokens";
import { AclClient } from "../clients/aclClient";
import { AclManager } from "../configs/aclManage";
import { PoolManager } from "../configs/pool";
import { AptosProvider } from "../wrappers/aptosProvider";
import chalk from "chalk";

export async function createRoles() {
  const aptosProvider = AptosProvider.fromEnvs();
  const aclClient = new AclClient(aptosProvider, AclManager);

  // add asset listing authorities
  const assetListingAuthoritiesAddresses = [UnderlyingManager, VariableManager, ATokenManager].map(
    (auth) => auth.accountAddress,
  );
  for (const auth of assetListingAuthoritiesAddresses) {
    const txReceipt = await aclClient.addAssetListingAdmin(auth);
    console.log(chalk.yellow(`Added ${auth} as an asset listing authority with tx hash = ${txReceipt.hash}`));
  }

  // create pool admin
  const txReceipt = await aclClient.addPoolAdmin(PoolManager.accountAddress);
  console.log(
    chalk.yellow(`Added ${PoolManager.accountAddress.toString()} as a pool admin with tx hash = ${txReceipt.hash}`),
  );
}
