/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import {
  AAAVE,
  AAVE,
  ADAI,
  ALINK,
  AUSDC,
  AWBTC,
  AWETH,
  DAI,
  LINK,
  UnderlyingManager,
  USDC,
  VAAVE,
  VDAI,
  VLINK,
  VUSDC,
  VWBTC,
  VWETH,
  WBTC,
  WETH,
} from "../configs/tokens";

import { AptosProvider } from "../wrappers/aptosProvider";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import chalk from "chalk";

const TREASURY = AccountAddress.fromString("0x800010ed1fe94674af83640117490d459e20441eab132c17e7ff39b7ae07a722");

interface UnderlyingToken {
  name: string;
  symbol: string;
  decimals: number;
  treasury: AccountAddress;
  metadataAddress: AccountAddress;
  accountAddress: AccountAddress;
}

interface AToken {
  name: string;
  symbol: string;
  underlyingSymbol: string;
  metadataAddress: AccountAddress;
  accountAddress: AccountAddress;
}

interface VarToken {
  name: string;
  symbol: string;
  underlyingSymbol: string;
  metadataAddress: AccountAddress;
  accountAddress: AccountAddress;
}

export const underlyingTokens: Array<UnderlyingToken> = [
  {
    symbol: DAI,
    name: DAI,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: WETH,
    name: WETH,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: USDC,
    name: USDC,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: AAVE,
    name: AAVE,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: LINK,
    name: LINK,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: WBTC,
    name: WBTC,
    decimals: 8,
    treasury: TREASURY,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  }
];

export const aTokens: Array<AToken> = [
  {
    symbol: ADAI,
    name: ADAI,
    underlyingSymbol: DAI,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: AWETH,
    name: AWETH,
    underlyingSymbol: WETH,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: AUSDC,
    name: AUSDC,
    underlyingSymbol: USDC,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: AAAVE,
    name: AAAVE,
    underlyingSymbol: AAVE,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: ALINK,
    name: ALINK,
    underlyingSymbol: LINK,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: AWBTC,
    name: AWBTC,
    underlyingSymbol: WBTC,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  }
];

export const varTokens: Array<VarToken> = [
  {
    symbol: VDAI,
    name: VDAI,
    underlyingSymbol: DAI,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: VWETH,
    name: VWETH,
    underlyingSymbol: WETH,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: VUSDC,
    name: VUSDC,
    underlyingSymbol: USDC,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: VAAVE,
    name: VAAVE,
    underlyingSymbol: AAVE,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },

  {
    symbol: VLINK,
    name: VLINK,
    underlyingSymbol: LINK,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  },
  {
    symbol: VWBTC,
    name: VWBTC,
    underlyingSymbol: WBTC,
    metadataAddress: AccountAddress.ZERO,
    accountAddress: AccountAddress.ZERO,
  }
];

export async function createTokens() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);

  // create underlying tokens
  for (const [index, underlyingToken] of underlyingTokens.entries()) {
    const txReceipt = await underlyingTokensClient.createToken(
      BigNumber.from("100000000000000000").toBigInt(),
      underlyingToken.name,
      underlyingToken.symbol,
      underlyingToken.decimals,
      "https://aptoscan.com/images/empty-coin.svg",
      "https://aptoscan.com",
    );
    console.log(chalk.yellow(`Deployed underlying asset ${underlyingToken.symbol} with tx hash = ${txReceipt.hash}`));

    const underlingMetadataAddress = await underlyingTokensClient.getMetadataBySymbol(underlyingToken.symbol);
    console.log(chalk.yellow(`${underlyingToken.symbol} underlying metadata address: `, underlingMetadataAddress));
    underlyingTokens[index].metadataAddress = underlingMetadataAddress;

    const underlyingTokenAddress = await underlyingTokensClient.getTokenAddress(underlyingToken.symbol);
    console.log(chalk.yellow(`${underlyingToken.symbol} underlying account address: `, underlyingTokenAddress));
    underlyingTokens[index].accountAddress = underlyingTokenAddress;
  }
}
