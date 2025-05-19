// @title Reserve Configuration Setup Script
// @author Aave
// @notice Script to configure reserve parameters for assets in the Aave pool
script {
    // imports
    // std
    use std::option;
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_std::debug::print;
    use aptos_std::string_utils::format1;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object::Self;
    // locals
    use aave_config::reserve_config;
    use aave_acl::acl_manage::Self;
    use aave_config::error_config;
    use aave_pool::pool_configurator;

    // Constants
    // @notice Network identifier for Aptos mainnet
    const APTOS_MAINNET: vector<u8> = b"mainnet";

    // @notice Network identifier for Aptos testnet
    const APTOS_TESTNET: vector<u8> = b"testnet";

    // @notice Success code for deployment verification
    const DEPLOYMENT_SUCCESS: u64 = 1;

    // @notice Failure code for deployment verification
    const DEPLOYMENT_FAILURE: u64 = 2;

    /// @notice Main function to configure reserve parameters for each asset in the pool
    /// @param account The signer account executing the script (must be an asset listing admin or pool admin)
    /// @param network The network identifier ("mainnet" or "testnet")
    fun main(account: &signer, network: String) {
        // Verify the caller has appropriate permissions
        assert!(
            acl_manage::is_asset_listing_admin(signer::address_of(account))
                || acl_manage::is_pool_admin(signer::address_of(account)),
            error_config::get_ecaller_not_asset_listing_or_pool_admin()
        );

        // Get all underlying assets based on the specified network
        let (_underlying_asset_keys, underlying_assets_addresses) =
            if (network == utf8(APTOS_MAINNET)) {
                aave_data::v1::get_underlying_assets_mainnet_normalized()
            } else if (network == utf8(APTOS_TESTNET)) {
                aave_data::v1::get_underlying_assets_testnet_normalized()
            } else {
                print(
                    &format1(&b"Unsupported network - {}. Using testnet values", network)
                );
                aave_data::v1::get_underlying_assets_testnet_normalized()
            };

        // Fetch all reserve configurations based on the specified network
        let (_reserve_config_keys, reserve_configs) =
            if (network == utf8(APTOS_MAINNET)) {
                aave_data::v1::get_reserves_config_mainnet_normalized()
            } else if (network == utf8(APTOS_TESTNET)) {
                aave_data::v1::get_reserves_config_testnet_normalized()
            } else {
                print(
                    &format1(&b"Unsupported network - {}. Using testnet values", network)
                );
                aave_data::v1::get_reserves_config_testnet_normalized()
            };

        // Configure each reserve with its specific parameters
        print(&format1(&b"Configuring reserves ... {}", 1));
        for (i in 0..vector::length(&underlying_assets_addresses)) {
            // Get underlying asset metadata
            let underlying_asset_address =
                *vector::borrow(&underlying_assets_addresses, i);
            let underlying_asset_metadata =
                object::address_to_object<Metadata>(underlying_asset_address);
            let underlying_asset_decimals =
                fungible_asset::decimals(underlying_asset_metadata);

            // Extract configuration parameters for this reserve
            let reserve_config = vector::borrow(&reserve_configs, i);
            let debt_ceiling = aave_data::v1_values::get_debt_ceiling(reserve_config);
            let flashLoan_enabled =
                aave_data::v1_values::get_flashLoan_enabled(reserve_config);
            let borrowable_isolation =
                aave_data::v1_values::get_borrowable_isolation(reserve_config);
            let supply_cap = aave_data::v1_values::get_supply_cap(reserve_config);
            let borrow_cap = aave_data::v1_values::get_borrow_cap(reserve_config);
            let ltv = aave_data::v1_values::get_base_ltv_as_collateral(reserve_config);
            let borrowing_enabled =
                aave_data::v1_values::get_borrowing_enabled(reserve_config);
            let reserve_factor = aave_data::v1_values::get_reserve_factor(reserve_config);
            let liquidation_threshold =
                aave_data::v1_values::get_liquidation_threshold(reserve_config);
            let liquidation_bonus =
                aave_data::v1_values::get_liquidation_bonus(reserve_config);
            let liquidation_protocol_fee =
                aave_data::v1_values::get_liquidation_protocol_fee(reserve_config);
            let siloed_borrowing =
                aave_data::v1_values::get_siloed_borrowing(reserve_config);

            // Create and populate new reserve configuration
            let reserve_config_new = reserve_config::init();

            // Set basic parameters
            reserve_config::set_decimals(
                &mut reserve_config_new, (underlying_asset_decimals as u256)
            );
            reserve_config::set_active(&mut reserve_config_new, true);
            reserve_config::set_frozen(&mut reserve_config_new, false);
            reserve_config::set_paused(&mut reserve_config_new, false);

            // Set liquidation parameters
            reserve_config::set_liquidation_threshold(
                &mut reserve_config_new, liquidation_threshold
            );
            reserve_config::set_liquidation_bonus(
                &mut reserve_config_new, liquidation_bonus
            );
            reserve_config::set_liquidation_protocol_fee(
                &mut reserve_config_new, liquidation_protocol_fee
            );

            // Set financial parameters
            reserve_config::set_reserve_factor(&mut reserve_config_new, reserve_factor);
            reserve_config::set_ltv(&mut reserve_config_new, ltv);
            reserve_config::set_debt_ceiling(&mut reserve_config_new, debt_ceiling);
            reserve_config::set_supply_cap(&mut reserve_config_new, supply_cap);
            reserve_config::set_borrow_cap(&mut reserve_config_new, borrow_cap);

            // Set feature flags
            reserve_config::set_flash_loan_enabled(
                &mut reserve_config_new, flashLoan_enabled
            );
            reserve_config::set_borrowable_in_isolation(
                &mut reserve_config_new, borrowable_isolation
            );
            reserve_config::set_siloed_borrowing(
                &mut reserve_config_new, siloed_borrowing
            );
            reserve_config::set_borrowing_enabled(
                &mut reserve_config_new, borrowing_enabled
            );

            // Configure E-Mode category if applicable
            let emode_category = aave_data::v1_values::get_emode_category(reserve_config);
            if (option::is_some(&emode_category)) {
                // Set E-Mode category in the reserve configuration
                reserve_config::set_emode_category(
                    &mut reserve_config_new, *option::borrow(&emode_category)
                );

                // Set the asset's E-Mode category in the pool
                pool_configurator::set_asset_emode_category(
                    account,
                    underlying_asset_address,
                    (*option::borrow(&emode_category) as u8)
                );
            };

            // Apply the configuration to the reserve
            aave_pool::pool::set_reserve_configuration_with_guard(
                account, underlying_asset_address, reserve_config_new
            );
        };
        print(&format1(&b"Finished configuring reserves! {}", 1));
    }
}
