import { AccountAddress, CommittedTransactionResponse } from "@aptos-labs/ts-sdk";
import { AptosContractWrapperBaseClass } from "./baseClass";
import {
  addPoolAdminFuncAddr,
  addAssetListingAdminFuncAddr,
  addEmergencyAdminFuncAddr,
  addFlashBorrowerFuncAddr,
  addRiskAdminFuncAddr,
  getAssetListingAdminRoleFuncAddr,
  getEmergencyAdminRoleFuncAddr,
  getFlashBorrowerRoleFuncAddr,
  getPoolAdminRoleFuncAddr,
  getRiskAdminRoleFuncAddr,
  grantRoleFuncAddr,
  hasRoleFuncAddr,
  isAssetListingAdminFuncAddr,
  isEmergencyAdminFuncAddr,
  isFlashBorrowerFuncAddr,
  isPoolAdminFuncAddr,
  isRiskAdminFuncAddr,
  removeAssetListingAdminFuncAddr,
  removeEmergencyAdminFuncAddr,
  removeFlashBorrowerFuncAddr,
  removePoolAdminFuncAddr,
  removeRiskAdminFuncAddr,
  renounceRoleFuncAddr,
  revokeRoleFuncAddr,
  defaultAdminRole,
  getRoleAdmin,
  setRoleAdmin,
} from "../configs/aclManage";

export class AclClient extends AptosContractWrapperBaseClass {
  public async hasRole(role: string, user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(hasRoleFuncAddr, [role, user]);
    return resp as boolean;
  }

  public async grantRole(role: string, user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(grantRoleFuncAddr, [role, user]);
  }

  public async renounceRole(role: string, user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(renounceRoleFuncAddr, [role, user]);
  }

  public async revokeRole(role: string, user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(revokeRoleFuncAddr, [role, user]);
  }

  public async addPoolAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(addPoolAdminFuncAddr, [user]);
  }

  public async removePoolAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(removePoolAdminFuncAddr, [user]);
  }

  public async isPoolAdmin(user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(isPoolAdminFuncAddr, [user]);
    return resp as boolean;
  }

  public async addEmergencyAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(addEmergencyAdminFuncAddr, [user]);
  }

  public async removeEmergencyAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(removeEmergencyAdminFuncAddr, [user]);
  }

  public async isEmergencyAdmin(user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(isEmergencyAdminFuncAddr, [user]);
    return resp as boolean;
  }

  public async addRiskAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(addRiskAdminFuncAddr, [user]);
  }

  public async removeRiskAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(removeRiskAdminFuncAddr, [user]);
  }

  public async isRiskAdmin(user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(isRiskAdminFuncAddr, [user]);
    return resp as boolean;
  }

  public async addFlashBorrower(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(addFlashBorrowerFuncAddr, [user]);
  }

  public async removeFlashBorrower(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(removeFlashBorrowerFuncAddr, [user]);
  }

  public async isFlashBorrower(user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(isFlashBorrowerFuncAddr, [user]);
    return resp as boolean;
  }

  public async addAssetListingAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(addAssetListingAdminFuncAddr, [user]);
  }

  public async removeAssetListingAdmin(user: AccountAddress): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(removeAssetListingAdminFuncAddr, [user]);
  }

  public async isAssetListingAdmin(user: AccountAddress): Promise<boolean> {
    const [resp] = await this.callViewMethod(isAssetListingAdminFuncAddr, [user]);
    return resp as boolean;
  }

  public async getPoolAdminRole(): Promise<string> {
    const [resp] = await this.callViewMethod(getPoolAdminRoleFuncAddr, []);
    return resp as string;
  }

  public async getEmergencyAdminRole(): Promise<string> {
    const [resp] = await this.callViewMethod(getEmergencyAdminRoleFuncAddr, []);
    return resp as string;
  }

  public async getRiskAdminRole(): Promise<string> {
    const [resp] = await this.callViewMethod(getRiskAdminRoleFuncAddr, []);
    return resp as string;
  }

  public async getFlashBorrowerRole(): Promise<string> {
    const [resp] = await this.callViewMethod(getFlashBorrowerRoleFuncAddr, []);
    return resp as string;
  }

  public async getAssetListingAdminRole(): Promise<string> {
    const [resp] = await this.callViewMethod(getAssetListingAdminRoleFuncAddr, []);
    return resp as string;
  }

  public async getDefaultAdminRole(): Promise<string> {
    const [resp] = await this.callViewMethod(defaultAdminRole, []);
    return resp as string;
  }

  public async getRoleAdmin(role: string): Promise<string> {
    const [resp] = await this.callViewMethod(getRoleAdmin, [role]);
    return resp as string;
  }

  public async setRoleAdmin(role: string, adminRole: string): Promise<CommittedTransactionResponse> {
    return this.sendTxAndAwaitResponse(setRoleAdmin, [role, adminRole]);
  }
}
