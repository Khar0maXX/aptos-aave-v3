// @title Oracle Price Feed Setup Script
// @author Aave
// @notice Script to configure price feeds for assets, aTokens, and variable debt tokens in the Aave protocol
script {
    // imports
    // std
    use std::option;
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_std::debug::print;
    use aptos_std::string_utils::format1;
    // locals
    use aave_acl::acl_manage::Self;
    use aave_config::error_config;
    use aave_oracle::oracle::Self;
    use aave_pool::pool;

    // Constants
    // @notice Network identifier for Aptos mainnet
    const APTOS_MAINNET: vector<u8> = b"mainnet";

    // @notice Network identifier for Aptos testnet
    const APTOS_TESTNET: vector<u8> = b"testnet";

    // @notice Success code for deployment verification
    const DEPLOYMENT_SUCCESS: u64 = 1;

    // @notice Failure code for deployment verification
    const DEPLOYMENT_FAILURE: u64 = 2;

    /// @notice Main function to set up price feeds for all assets in the Aave protocol
    /// @param account The signer account executing the script (must be a risk admin or pool admin)
    /// @param network The network identifier ("mainnet" or "testnet")
    fun main(account: &signer, network: String) {
        // Verify the caller has appropriate permissions
        assert!(
            acl_manage::is_risk_admin(signer::address_of(account))
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

        // Fetch all price feeds based on the specified network
        let (_price_feed_keys, price_feeds) =
            if (network == utf8(APTOS_MAINNET)) {
                aave_data::v1::get_price_feeds_mainnet_normalized()
            } else if (network == utf8(APTOS_TESTNET)) {
                aave_data::v1::get_price_feeds_testnet_normalized()
            } else {
                print(
                    &format1(&b"Unsupported network - {}. Using testnet values", network)
                );
                aave_data::v1::get_price_feeds_testnet_normalized()
            };

        // Configure price feeds for each asset and its related tokens
        print(&format1(&b"Configuring price feeds ... {}", 1));
        for (i in 0..vector::length(&underlying_assets_addresses)) {
            // Get the underlying asset address and its reserve data
            let underlying_asset_address =
                *vector::borrow(&underlying_assets_addresses, i);
            let reserve_data = pool::get_reserve_data(underlying_asset_address);

            // Get the price feed for this asset
            let price_feed = vector::borrow(&price_feeds, i);

            // Set the same price feed for the underlying asset, aToken, and variable debt token
            // This ensures consistent price reporting across all related tokens
            oracle::set_asset_feed_id(account, underlying_asset_address, *price_feed);
            oracle::set_asset_feed_id(
                account, pool::get_reserve_a_token_address(reserve_data), *price_feed
            );
            oracle::set_asset_feed_id(
                account,
                pool::get_reserve_variable_debt_token_address(reserve_data),
                *price_feed
            );

            // Verify the price feed is working correctly
            assert!(
                oracle::get_asset_price(underlying_asset_address) > 0,
                DEPLOYMENT_SUCCESS
            );

            // Verify no price caps are set (default configuration)
            assert!(
                option::is_none(&oracle::get_price_cap(underlying_asset_address)),
                DEPLOYMENT_SUCCESS
            );
        };
        print(&format1(&b"Finished configuring price feeds! {}", 1));
    }
}
