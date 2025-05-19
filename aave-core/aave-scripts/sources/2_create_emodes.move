// @title E-Mode Setup Script
// @author Aave
// @notice Script to configure E-Mode categories in the Aave pool
script {
    // imports
    // std
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_std::debug::print;
    use aptos_std::string_utils::format1;
    // locals
    use aave_pool::pool_configurator;
    use aave_acl::acl_manage::Self;
    use aave_config::error_config;

    // Constants
    // @notice Network identifier for Aptos mainnet
    const APTOS_MAINNET: vector<u8> = b"mainnet";

    // @notice Network identifier for Aptos testnet
    const APTOS_TESTNET: vector<u8> = b"testnet";

    // @notice Success code for deployment verification
    const DEPLOYMENT_SUCCESS: u64 = 1;

    // @notice Failure code for deployment verification
    const DEPLOYMENT_FAILURE: u64 = 2;

    /// @notice Main function to set up E-Mode categories in the Aave pool
    /// @param account The signer account executing the script (must be a risk admin or pool admin)
    /// @param network The network identifier ("mainnet" or "testnet")
    fun main(account: &signer, network: String) {
        // Verify the caller has appropriate permissions
        assert!(
            acl_manage::is_risk_admin(signer::address_of(account))
                || acl_manage::is_pool_admin(signer::address_of(account)),
            error_config::get_ecaller_not_risk_or_pool_admin()
        );

        // Get E-Mode configurations based on the specified network
        let (_emode_category_ids, emode_configs) =
            if (network == utf8(APTOS_MAINNET)) {
                aave_data::v1::get_emodes_mainnet_normalized()
            } else if (network == utf8(APTOS_TESTNET)) {
                aave_data::v1::get_emode_testnet_normalized()
            } else {
                print(
                    &format1(&b"Unsupported network - {}. Using testnet values", network)
                );
                aave_data::v1::get_emode_testnet_normalized()
            };

        // Process and configure each E-Mode category
        for (i in 0..vector::length(&emode_configs)) {
            let emode_config = *vector::borrow(&emode_configs, i);

            // Extract E-Mode configuration parameters
            let emode_category_id =
                aave_data::v1_values::get_emode_category_id(&emode_config);
            let emode_liquidation_label =
                aave_data::v1_values::get_emode_liquidation_label(&emode_config);
            let emode_liquidation_threshold =
                aave_data::v1_values::get_emode_liquidation_threshold(&emode_config);
            let emode_liquidation_bonus =
                aave_data::v1_values::get_emode_liquidation_bonus(&emode_config);
            let emode_ltv = aave_data::v1_values::get_emode_ltv(&emode_config);

            // Configure the E-Mode category in the pool
            pool_configurator::set_emode_category(
                account,
                (emode_category_id as u8),
                (emode_ltv as u16),
                (emode_liquidation_threshold as u16),
                (emode_liquidation_bonus as u16),
                emode_liquidation_label
            );
        };
    }
}
