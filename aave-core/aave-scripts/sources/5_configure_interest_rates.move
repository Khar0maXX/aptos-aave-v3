// @title Interest Rate Strategy Setup Script
// @author Aave
// @notice Script to configure interest rate strategies for assets in the Aave pool
script {
    // imports
    // std
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_std::debug::print;
    use aptos_std::string_utils::format1;
    // locals
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

    /// @notice Main function to configure interest rate strategies for each asset in the pool
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

        // Fetch all interest rate strategies based on the specified network
        let (_interest_rate_strategy_keys, interest_rate_strategy_maps) =
            if (network == utf8(APTOS_MAINNET)) {
                aave_data::v1::get_interest_rate_strategy_mainnet_normalized()
            } else if (network == utf8(APTOS_TESTNET)) {
                aave_data::v1::get_interest_rate_strategy_testnet_normalized()
            } else {
                print(
                    &format1(&b"Unsupported network - {}. Using testnet values", network)
                );
                aave_data::v1::get_interest_rate_strategy_testnet_normalized()
            };

        // Configure each asset with its specific interest rate strategy
        print(&format1(&b"Configuring interest rate strategies ... {}", 1));
        for (i in 0..vector::length(&underlying_assets_addresses)) {
            // Get the underlying asset address and its corresponding interest rate strategy
            let underlying_asset_address =
                *vector::borrow(&underlying_assets_addresses, i);
            let interest_rate_strategy_map = vector::borrow(
                &interest_rate_strategy_maps, i
            );

            // Extract interest rate parameters for this asset
            let optimal_usage_ratio =
                aave_data::v1_values::get_optimal_usage_ratio(interest_rate_strategy_map);
            let base_variable_borrow_rate =
                aave_data::v1_values::get_base_variable_borrow_rate(
                    interest_rate_strategy_map
                );
            let variable_rate_slope1 =
                aave_data::v1_values::get_variable_rate_slope1(interest_rate_strategy_map);
            let variable_rate_slope2: u256 =
                aave_data::v1_values::get_variable_rate_slope2(interest_rate_strategy_map);

            // Update the interest rate strategy for this asset in the pool
            pool_configurator::update_interest_rate_strategy(
                account,
                underlying_asset_address,
                optimal_usage_ratio,
                base_variable_borrow_rate,
                variable_rate_slope1,
                variable_rate_slope2
            );
        };
        print(&format1(&b"Finished configuring interest rate strategies! {}", 1));
    }
}
