import { AccountAddress } from "@aptos-labs/ts-sdk";
import { PoolManager } from "../configs/pool";
import { AptosProvider } from "../wrappers/aptosProvider";
import { PoolClient } from "../clients/poolClient";

export interface EModeConfig {
  categoryId: number;
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  label: string;
}

export const eModes: Array<EModeConfig> = [
    {
      categoryId: 1,
      ltv: 9000,
      liquidationThreshold: 9300,
      liquidationBonus: 10200,
      label: "ETH correlated",
    },
    {
      categoryId: 2,
      ltv: 9500,
      liquidationThreshold: 9700,
      liquidationBonus: 10100,
      label: "Stablecoins",
    },
  ];

  export async function initEModes() {
    // global aptos provider
    const aptosProvider = AptosProvider.fromEnvs();
    const poolClient = new PoolClient(aptosProvider, PoolManager);
    for (const eMode of eModes) {
        const receipt = await poolClient.setEmodeCategory(
            eMode.categoryId,
            eMode.ltv,
            eMode.liquidationThreshold,
            eMode.liquidationBonus,
            eMode.label,
        );
        console.log(
        `EMODE ${eMode.label} with id ${eMode.categoryId} was setup, tx hash ${receipt.hash}`,
        );
    }
}
