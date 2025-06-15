import { AptosProvider, ATokensClient, UnderlyingTokensClient, VariableTokensClient } from "@aave/aave-v3-aptos-ts-sdk";
import { aTokens, underlyingTokens, varTokens } from "../configs/config";

export async function getTokens() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, aptosProvider.getUnderlyingTokensProfileAccount());
  const aTokensClient = new ATokensClient(aptosProvider, aptosProvider.getPoolProfileAccount());
  const varTokensClient = new VariableTokensClient(aptosProvider, aptosProvider.getPoolProfileAccount());

  // get underlying tokens
  for (const [, underlyingToken] of underlyingTokens.entries()) {
    const underlingMetadataAddress = await underlyingTokensClient.getMetadataBySymbol(underlyingToken.symbol);
    underlyingToken.metadataAddress = underlingMetadataAddress;

    const underlyingTokenAddress = await underlyingTokensClient.tokenAddress(underlyingToken.symbol);
    underlyingToken.accountAddress = underlyingTokenAddress;
  }

  // get atokens
  const poolManager = aptosProvider.getPoolProfileAccount();
  for (const [, aToken] of aTokens.entries()) {
    const aTokenMetadataAddress = await aTokensClient.getMetadataBySymbol(aToken.symbol);
    aToken.metadataAddress = aTokenMetadataAddress;

    const aTokenAddress = await aTokensClient.getTokenAddress(aToken.symbol);
    aToken.accountAddress = aTokenAddress;
  }

  // get var debt tokens
  for (const [, varToken] of varTokens.entries()) {
    const varTokenMetadataAddress = await varTokensClient.getMetadataBySymbol(
      varToken.symbol,
    );
    varToken.metadataAddress = varTokenMetadataAddress;

    const varTokenAddress = await varTokensClient.getTokenAddress(varToken.symbol);
    varToken.accountAddress = varTokenAddress;
  }
}
