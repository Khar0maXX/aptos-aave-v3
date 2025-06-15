import { Account, AccountAddress, Ed25519Account } from "@aptos-labs/ts-sdk";
import { getTokens } from "../scripts/getTokens";
import { AclClient, AptosProvider } from "@aave/aave-v3-aptos-ts-sdk";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const TREASURY = AccountAddress.fromString("0x800010ed1fe94674af83640117490d459e20441eab132c17e7ff39b7ae07a722");

// Tokens
export const DAI = "DAI";
export const WETH = "WETH";
export const USDC = "USDC";
export const AAVE = "AAVE";
export const LINK = "LINK";
export const WBTC = "WBTC";

// A Tokens
export const ADAI = "ADAI";
export const AWETH = "AWETH";
export const AUSDC = "AUSDC";
export const AAAVE = "AAAVE";
export const ALINK = "ALINK";
export const AWBTC = "AWBTC";

// Variable Tokens
export const VDAI = "VDAI";
export const VWETH = "VWETH";
export const VUSDC = "VUSDC";
export const VAAVE = "VAAVE";
export const VLINK = "VLINK";
export const VWBTC = "VWBTC";

interface TestEnv {
  emergencyAdmin: Ed25519Account;
  riskAdmin: Ed25519Account;
  users: Ed25519Account[];
  weth: AccountAddress;
  aWETH: AccountAddress;
  dai: AccountAddress;
  aDai: AccountAddress;
  aAave: AccountAddress;
  vDai: AccountAddress;
  aUsdc: AccountAddress;
  usdc: AccountAddress;
  aave: AccountAddress;
}

export const testEnv: TestEnv = {
  emergencyAdmin: {} as Ed25519Account,
  riskAdmin: {} as Ed25519Account,
  users: [] as Ed25519Account[],
  weth: AccountAddress.ZERO,
  aWETH: AccountAddress.ZERO,
  dai: AccountAddress.ZERO,
  aDai: AccountAddress.ZERO,
  vDai: AccountAddress.ZERO,
  aUsdc: AccountAddress.ZERO,
  usdc: AccountAddress.ZERO,
  aave: AccountAddress.ZERO,
} as TestEnv;

const aptosProvider = AptosProvider.fromEnvs();

export async function getTestAccounts(): Promise<Ed25519Account[]> {
  // 1. create accounts
  const accounts: Ed25519Account[] = [];
  const manager0 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_0"),
  });
  accounts.push(manager0);

  const manager1 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_1"),
  });
  accounts.push(manager1);

  const manager2 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_2"),
  });
  accounts.push(manager2);

  const manager3 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_3"),
  });
  accounts.push(manager3);

  const manager4 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_4"),
  });
  accounts.push(manager4);

  const manager5 = Account.fromPrivateKey({
    privateKey: aptosProvider.getProfileAccountPrivateKeyByName("test_account_5"),
  });
  accounts.push(manager5);
  return accounts;
}

export async function initializeMakeSuite() {

  await getTokens();

  // account manage
  testEnv.users = await getTestAccounts();
  // eslint-disable-next-line prefer-destructuring
  testEnv.emergencyAdmin = testEnv.users[1];
  // eslint-disable-next-line prefer-destructuring
  testEnv.riskAdmin = testEnv.users[2];

  testEnv.aDai = aTokens.find((token) => token.symbol === ADAI).metadataAddress;
  testEnv.aUsdc = aTokens.find((token) => token.symbol === AUSDC).metadataAddress;
  testEnv.aWETH = aTokens.find((token) => token.symbol === AWETH).metadataAddress;
  testEnv.aAave = aTokens.find((token) => token.symbol === AAAVE).metadataAddress;

  testEnv.vDai = varTokens.find((token) => token.symbol === VDAI).metadataAddress;

  testEnv.dai = underlyingTokens.find((token) => token.symbol === DAI).accountAddress;
  testEnv.aave = underlyingTokens.find((token) => token.symbol === AAVE).accountAddress;
  testEnv.usdc = underlyingTokens.find((token) => token.symbol === USDC).accountAddress;
  testEnv.weth = underlyingTokens.find((token) => token.symbol === WETH).accountAddress;

  const aclClient = new AclClient(aptosProvider, aptosProvider.getAclProfileAccount());

  // setup admins
  const isRiskAdmin = await aclClient.isRiskAdmin(testEnv.riskAdmin.accountAddress);
  if (!isRiskAdmin) {
    await aclClient.addRiskAdmin(testEnv.riskAdmin.accountAddress);
  }
  const isEmergencyAdmin = await aclClient.isEmergencyAdmin(testEnv.emergencyAdmin.accountAddress);
  if (!isEmergencyAdmin) {
    await aclClient.addEmergencyAdmin(testEnv.emergencyAdmin.accountAddress);
  }
}

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
