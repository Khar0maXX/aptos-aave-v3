import { BigNumber } from "@ethersproject/bignumber";
import chalk from "chalk";
import { AptosProvider, UnderlyingTokensClient } from "@aave/aave-v3-aptos-ts-sdk";
import { underlyingTokens } from "../configs/config";

export async function createTokens() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, aptosProvider.getUnderlyingTokensProfileAccount());

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

    const underlyingTokenAddress = await underlyingTokensClient.tokenAddress(underlyingToken.symbol);
    console.log(chalk.yellow(`${underlyingToken.symbol} underlying account address: `, underlyingTokenAddress));
    underlyingTokens[index].accountAddress = underlyingTokenAddress;
  }
}
