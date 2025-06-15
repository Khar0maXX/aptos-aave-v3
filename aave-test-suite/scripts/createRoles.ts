import { AclClient, AptosProvider } from "@aave/aave-v3-aptos-ts-sdk";
import chalk from "chalk";

export async function createRoles() {
  const aptosProvider = AptosProvider.fromEnvs();
  const aclClient = new AclClient(aptosProvider, aptosProvider.getAclProfileAccount());

  // add asset listing authorities
  const assetListingAuthoritiesAddresses = [
    aptosProvider.getUnderlyingTokensProfileAccount(),
    aptosProvider.getPoolProfileAccount(),
  ];
  for (const auth of assetListingAuthoritiesAddresses) {
    const txReceipt = await aclClient.addAssetListingAdmin(auth.accountAddress);
    console.log(
      chalk.yellow(
        `Added ${auth.accountAddress.toString()} as an asset listing authority with tx hash = ${txReceipt.hash}`,
      ),
    );
  }

  // add the pool admin to the pool
  const poolAdminManager = aptosProvider.getPoolProfileAccount();

  // create pool admin
  const txReceipt = await aclClient.addPoolAdmin(poolAdminManager.accountAddress);
  chalk.yellow(
    `Added ${poolAdminManager.toString()} as a pool admin with tx hash = ${txReceipt.hash}`,
  );
}
