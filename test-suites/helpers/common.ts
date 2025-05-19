import { BigNumber } from "@ethersproject/bignumber";

export const stringToUint8Array = (data: string): Uint8Array => new Uint8Array(Buffer.from(data, "utf8"));

export const stringToHex = (data: string): string => Buffer.from(data).toString("hex");

export const uint8ArrayToString = (data: Uint8Array): string => Buffer.from(data).toString("utf8");

export const hexToUint8Array = (hexString: string): Uint8Array => {
  if (hexString.startsWith("0x")) {
    hexString = hexString.slice(2);
  }
  return Uint8Array.from(Buffer.from(hexString, "hex"));
};

export const rayToBps = (ray: BigNumber): BigNumber => {
  return ray.div(BigNumber.from("10").pow(23));
}
