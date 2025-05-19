import {
  UnderlyingManager,
} from "../configs/tokens";

import { AptosProvider } from "../wrappers/aptosProvider";
import { UnderlyingTokensClient } from "../clients/underlyingTokensClient";
import { ATokensClient } from "../clients/aTokensClient";
import { VariableTokensClient } from "../clients/variableTokensClient";
import { aTokens, underlyingTokens, varTokens } from "./createTokens";

export async function getTokens() {
  // global aptos provider
  const aptosProvider = AptosProvider.fromEnvs();
  const underlyingTokensClient = new UnderlyingTokensClient(aptosProvider, UnderlyingManager);
  const aTokensClient = new ATokensClient(aptosProvider);
  const varTokensClient = new VariableTokensClient(aptosProvider);

  // get underlying tokens
  for (const [, underlyingToken] of underlyingTokens.entries()) {
    const underlingMetadataAddress = await underlyingTokensClient.getMetadataBySymbol(underlyingToken.symbol);
    underlyingToken.metadataAddress = underlingMetadataAddress;

    const underlyingTokenAddress = await underlyingTokensClient.getTokenAddress(underlyingToken.symbol);
    underlyingToken.accountAddress = underlyingTokenAddress;
  }

  // get atokens
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
