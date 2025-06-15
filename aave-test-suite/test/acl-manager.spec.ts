import { Ed25519Account } from "@aptos-labs/ts-sdk";
import { initializeMakeSuite, testEnv } from "../configs/config";
import { AclClient, AptosProvider } from "@aave/aave-v3-aptos-ts-sdk";

describe("Access Control List Manager", () => {

  let aptosProvider: AptosProvider;
  let aclClient: AclClient;
  let aclManager: Ed25519Account;

  beforeAll(async () => {
    await initializeMakeSuite();
    aptosProvider = AptosProvider.fromEnvs();
    aclManager = aptosProvider.getAclProfileAccount();
    aclClient = new AclClient(aptosProvider, aclManager);
  });

  it("Grant FLASH_BORROW_ADMIN role", async () => {
    const {
      users: [flashBorrowAdmin],
    } = testEnv;

    const isFlashBorrower = await aclClient.isFlashBorrower(flashBorrowAdmin.accountAddress);
    expect(isFlashBorrower).toBe(false);

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    await aclClient.withSigner(aclManager).grantRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);

    const isFlashBorrowAfter = await aclClient.isFlashBorrower(flashBorrowAdmin.accountAddress);
    expect(isFlashBorrowAfter).toBe(true);
  });

  it("FLASH_BORROW_ADMIN grant FLASH_BORROW_ROLE (revert expected)", async () => {
    const {
      users: [flashBorrowAdmin, flashBorrower],
    } = testEnv;

    const isFlashBorrower = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrower).toBe(false);

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    const hasFlashBorrowerRole = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRole).toBe(true);

    try {
      await aclClient.withSigner(flashBorrowAdmin).addFlashBorrower(flashBorrower.accountAddress);
    } catch (err) {
      expect(err.toString().includes("0x3ea")).toBe(true);
    }

    const isFlashBorrowerAfter = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrowerAfter).toBe(false);

    const hasFlashBorrowerRoleAfter = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRoleAfter).toBe(true);
  });

  it("Make FLASH_BORROW_ADMIN_ROLE admin of FLASH_BORROWER_ROLE", async () => {
    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    expect(flashBorrowerRole).toBe("FLASH_BORROWER");
  });

  it("FLASH_BORROW_ADMIN grant FLASH_BORROW_ROLE", async () => {
    const {
      users: [flashBorrowAdmin, flashBorrower],
    } = testEnv;

    const isFlashBorrower = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrower).toBe(false);

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    const hasFlashBorrowerRole = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRole).toBe(true);

    await aclClient.withSigner(aclManager).addFlashBorrower(flashBorrower.accountAddress);

    const isFlashBorrowerAfter = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrowerAfter).toBe(true);

    const hasFlashBorrowerRoleAfter = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRoleAfter).toBe(true);
  });

  it("DEFAULT_ADMIN tries to revoke FLASH_BORROW_ROLE (revert expected)", async () => {
    const {
      users: [flashBorrowAdmin, flashBorrower],
    } = testEnv;

    const isFlashBorrower = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrower).toBe(true);

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    const hasFlashBorrowerRole = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRole).toBe(true);

    try {
      await aclClient.withSigner(flashBorrowAdmin).removeFlashBorrower(flashBorrower.accountAddress);
    } catch (err) {
      expect(err.toString().includes("0x3ea")).toBe(true);
    }

    const isFlashBorrowerAfter = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrowerAfter).toBe(true);

    const hasFlashBorrowerRoleAfter = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRoleAfter).toBe(true);
  });

  it("Grant POOL_ADMIN role", async () => {
    const {
      users: [, poolAdmin],
    } = testEnv;

    const isAdmin = await aclClient.isPoolAdmin(poolAdmin.accountAddress);
    expect(isAdmin).toBe(false);

    await aclClient.withSigner(aclManager).addPoolAdmin(poolAdmin.accountAddress);

    const isAdminAfter = await aclClient.isPoolAdmin(poolAdmin.accountAddress);
    expect(isAdminAfter).toBe(true);
  });

  it("Grant EMERGENCY_ADMIN role", async () => {
    const {
      users: [, , emergencyAdmin],
    } = testEnv;
    const isAdmin = await aclClient.isEmergencyAdmin(emergencyAdmin.accountAddress);
    expect(isAdmin).toBe(false);

    await aclClient.withSigner(aclManager).addEmergencyAdmin(emergencyAdmin.accountAddress);

    const isAdminAfter = await aclClient.isEmergencyAdmin(emergencyAdmin.accountAddress);
    expect(isAdminAfter).toBe(true);
  });

  it("Grant RISK_ADMIN role", async () => {
    const {
      users: [, , , , riskAdmin],
    } = testEnv;
    const isAdmin = await aclClient.isRiskAdmin(riskAdmin.accountAddress);
    expect(isAdmin).toBe(false);

    await aclClient.withSigner(aclManager).addRiskAdmin(riskAdmin.accountAddress);

    const isAdminAfter = await aclClient.isRiskAdmin(riskAdmin.accountAddress);
    expect(isAdminAfter).toBe(true);
  });

  it("Grant ASSET_LISTING_ADMIN role", async () => {
    const {
      users: [, , , , , assetListingAdmin],
    } = testEnv;

    const isAdmin = await aclClient.isAssetListingAdmin(assetListingAdmin.accountAddress);
    expect(isAdmin).toBe(false);

    await aclClient.withSigner(aclManager).addAssetListingAdmin(assetListingAdmin.accountAddress);

    const isAdminAfter = await aclClient.isAssetListingAdmin(assetListingAdmin.accountAddress);
    expect(isAdminAfter).toBe(true);
  });

  it("Revoke FLASH_BORROWER", async () => {
    const {
      users: [flashBorrowAdmin, flashBorrower],
    } = testEnv;

    const isFlashBorrower = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrower).toBe(true);

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    const hasFlashBorrowerRole = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRole).toBe(true);

    await aclClient.withSigner(aclManager).removeFlashBorrower(flashBorrower.accountAddress);

    const isFlashBorrowerAfter = await aclClient.isFlashBorrower(flashBorrower.accountAddress);
    expect(isFlashBorrowerAfter).toBe(false);

    const hasFlashBorrowerRoleAfter = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(hasFlashBorrowerRoleAfter).toBe(true);
  });

  it("Revoke FLASH_BORROWER_ADMIN", async () => {
    const {
      users: [flashBorrowAdmin],
    } = testEnv;

    const flashBorrowerRole = await aclClient.getFlashBorrowerRole();
    const isFlashBorrowerAdmin = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(isFlashBorrowerAdmin).toBe(true);

    await aclClient.withSigner(aclManager).revokeRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);

    const isFlashBorrowerAdminAfter = await aclClient.hasRole(flashBorrowerRole, flashBorrowAdmin.accountAddress);
    expect(isFlashBorrowerAdminAfter).toBe(false);
  });

  it("Revoke POOL_ADMIN", async () => {
    const {
      users: [, poolAdmin],
    } = testEnv;

    const isPoolAdmin = await aclClient.isPoolAdmin(poolAdmin.accountAddress);
    expect(isPoolAdmin).toBe(true);

    await aclClient.withSigner(aclManager).removePoolAdmin(poolAdmin.accountAddress);

    const isPoolAdminAfter = await aclClient.isPoolAdmin(poolAdmin.accountAddress);
    expect(isPoolAdminAfter).toBe(false);
  });

  it("Revoke EMERGENCY_ADMIN", async () => {
    const {
      users: [, , emergencyAdmin],
    } = testEnv;

    const isEmergencyAdmin = await aclClient.isEmergencyAdmin(emergencyAdmin.accountAddress);
    expect(isEmergencyAdmin).toBe(true);

    await aclClient.withSigner(aclManager).removeEmergencyAdmin(emergencyAdmin.accountAddress);

    const isEmergencyAdminAfter = await aclClient.isEmergencyAdmin(emergencyAdmin.accountAddress);
    expect(isEmergencyAdminAfter).toBe(false);
  });

  it("Revoke RISK_ADMIN", async () => {
    const {
      users: [, , , , riskAdmin],
    } = testEnv;

    const isRiskAdmin = await aclClient.isRiskAdmin(riskAdmin.accountAddress);
    expect(isRiskAdmin).toBe(true);

    await aclClient.withSigner(aclManager).removeRiskAdmin(riskAdmin.accountAddress);

    const isRiskAdminAfter = await aclClient.isRiskAdmin(riskAdmin.accountAddress);
    expect(isRiskAdminAfter).toBe(false);
  });

  it("Revoke ASSET_LISTING_ADMIN", async () => {
    const {
      users: [, , , , , assetListingAdmin],
    } = testEnv;

    const isAssetListingAdmin = await aclClient.isAssetListingAdmin(assetListingAdmin.accountAddress);
    expect(isAssetListingAdmin).toBe(true);

    await aclClient.withSigner(aclManager).removeAssetListingAdmin(assetListingAdmin.accountAddress);

    const isAssetListingAdminAfter = await aclClient.isAssetListingAdmin(assetListingAdmin.accountAddress);
    expect(isAssetListingAdminAfter).toBe(false);
  });
});
