/// @title Oracle
/// @author Aave
/// @notice Provides price feed functionality for the Aave protocol
module aave_oracle::oracle {
    // imports
    use std::option;
    use std::option::Option;
    use std::vector;
    use std::signer;
    use aptos_std::smart_table;
    use aptos_framework::event;
    use aptos_framework::account::{Self, SignerCapability};
    use data_feeds::router::{Self as chainlink_router};
    use data_feeds::registry::{Self as chainlink};
    use aave_acl::acl_manage;
    use aave_config::error_config::Self;
    #[test_only]
    use aptos_std::string_utils::format1;
    #[test_only]
    use aptos_framework::timestamp;

    // Constants
    /// @notice Seed for the resource account
    const AAVE_ORACLE_SEED: vector<u8> = b"AAVE_ORACLE";
    /// @notice Decimal precision for Chainlink asset prices
    /// @dev Reference: https://docs.chain.link/data-feeds/price-feeds/addresses?network=aptos&page=1
    const CHAINLINK_ASSET_DECIMAL_PRECISION: u8 = 18;

    /// @notice Maximum value for a 192-bit signed integer (192-th bit is sign bit)
    /// @dev All positive values are in [0, 2^191 - 1]
    const I192_MAX: u256 = 3138550867693340381917894711603833208051177722232017256447; // 2^191 - 1

    // Event definitions
    #[event]
    struct AssetPriceFeedUpdated has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev Feed ID for the asset
        feed_id: vector<u8>
    }

    #[event]
    /// @notice Emitted when an asset custom price is updated
    struct AssetCustomPriceUpdated has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev Custom price value
        custom_price: u256
    }

    #[event]
    /// @notice Emitted when an asset price feed is removed
    struct AssetPriceFeedRemoved has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev Feed ID that was removed
        feed_id: vector<u8>
    }

    #[event]
    /// @notice Emitted when an asset custom price is removed
    struct AssetCustomPriceRemoved has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev Custom price that was removed
        custom_price: u256
    }

    #[event]
    /// @notice Emitted when a price cap is updated for an asset
    struct PriceCapUpdated has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev New price cap value
        price_cap: u256
    }

    #[event]
    /// @notice Emitted when a price cap is removed for an asset
    struct PriceCapRemoved has store, drop {
        /// @dev Address of the asset
        asset: address,
        /// @dev Price cap that was removed
        price_cap: u256
    }

    // Structs
    /// @notice Main storage for oracle data
    struct PriceOracleData has key {
        /// @dev Mapping of asset addresses to their feed IDs
        asset_feed_ids: smart_table::SmartTable<address, vector<u8>>,
        /// @dev Mapping of asset addresses to their custom prices
        custom_asset_prices: smart_table::SmartTable<address, u256>,
        /// @dev Capability to generate the resource account signer
        signer_cap: SignerCapability,
        /// @dev Mapping of asset addresses to their price caps
        capped_assets_data: smart_table::SmartTable<address, u256>
    }

    // Module initialization
    /// @dev Initializes the oracle module
    /// @param account Admin account that initializes the module
    fun init_module(account: &signer) {
        only_oracle_admin(account);

        // create a resource account
        let (resource_signer, signer_cap) =
            account::create_resource_account(account, AAVE_ORACLE_SEED);

        move_to(
            &resource_signer,
            PriceOracleData {
                asset_feed_ids: smart_table::new(),
                signer_cap,
                custom_asset_prices: smart_table::new(),
                capped_assets_data: smart_table::new()
            }
        )
    }

    // Public view functions
    #[view]
    /// @notice Checks if an asset's price is capped (actual price exceeds cap)
    /// @param asset Address of the asset to check
    /// @return True if the asset's actual price exceeds its cap
    public fun is_asset_price_capped(asset: address): bool acquires PriceOracleData {
        let price_oracle_data = borrow_global<PriceOracleData>(oracle_address());
        if (!smart_table::contains(&price_oracle_data.capped_assets_data, asset)) {
            return false;
        };
        get_asset_price_internal(asset) > get_asset_price(asset)
    }

    #[view]
    /// @notice Gets the current price of an asset, respecting any price cap
    /// @param asset Address of the asset
    /// @return The asset price (capped if applicable)
    public fun get_asset_price(asset: address): u256 acquires PriceOracleData {
        let base_price = get_asset_price_internal(asset);
        let price_oracle_data = borrow_global<PriceOracleData>(oracle_address());
        let capped_assets_data = &price_oracle_data.capped_assets_data;
        if (!smart_table::contains(capped_assets_data, asset)) {
            return base_price;
        };
        let cap = *smart_table::borrow(capped_assets_data, asset);
        if (base_price > cap) {
            return cap
        };
        base_price
    }

    #[view]
    /// @notice Gets the price cap for an asset if it exists
    /// @param asset Address of the asset
    /// @return The price cap if it exists, none otherwise
    public fun get_price_cap(asset: address): Option<u256> acquires PriceOracleData {
        let price_oracle_data = borrow_global<PriceOracleData>(oracle_address());
        let capped_assets_data = &price_oracle_data.capped_assets_data;
        if (!smart_table::contains(capped_assets_data, asset)) {
            return option::none<u256>();
        };
        let cap = *smart_table::borrow(capped_assets_data, asset);
        option::some(cap)
    }

    #[view]
    /// @notice Gets prices for multiple assets at once
    /// @param assets Vector of asset addresses
    /// @return Vector of corresponding asset prices
    public fun get_assets_prices(assets: vector<address>): vector<u256> acquires PriceOracleData {
        let prices = vector<u256>[];
        for (i in 0..vector::length(&assets)) {
            let asset = *vector::borrow(&assets, i);
            let price = get_asset_price(asset);
            vector::insert(&mut prices, i, price);
        };
        prices
    }

    #[view]
    /// @notice Gets the oracle's resource account address
    /// @return The oracle's address
    public fun oracle_address(): address {
        account::create_resource_address(&@aave_oracle, AAVE_ORACLE_SEED)
    }

    #[view]
    /// @notice Gets the decimal precision used for asset prices
    /// @return The number of decimal places (always 18)
    public fun get_asset_price_decimals(): u8 {
        // NOTE: all asset prices have exactly 18 dp.
        CHAINLINK_ASSET_DECIMAL_PRECISION
    }

    // Public entry functions
    /// @notice Sets a price cap for an asset
    /// @param account Admin account that sets the cap
    /// @param asset Address of the asset
    /// @param price_cap Maximum price value for the asset
    public entry fun set_price_cap_stable_adapter(
        account: &signer, asset: address, price_cap: u256
    ) acquires PriceOracleData {
        only_risk_or_pool_admin(account);
        let base_price = get_asset_price_internal(asset);
        assert!(
            price_cap >= base_price, error_config::get_ecap_lower_than_actual_price()
        );
        let price_oracle_data = borrow_global_mut<PriceOracleData>(oracle_address());
        smart_table::upsert(
            &mut price_oracle_data.capped_assets_data,
            asset,
            price_cap
        );
        event::emit(PriceCapUpdated { asset, price_cap });
    }

    /// @notice Removes a price cap for an asset
    /// @param account Admin account that removes the cap
    /// @param asset Address of the asset
    public entry fun remove_price_cap_stable_adapter(
        account: &signer, asset: address
    ) acquires PriceOracleData {
        only_risk_or_pool_admin(account);
        let price_oracle_data = borrow_global_mut<PriceOracleData>(oracle_address());
        assert!(
            smart_table::contains(&price_oracle_data.capped_assets_data, asset),
            error_config::get_easset_no_price_cap()
        );
        let price_cap = *smart_table::borrow(
            &price_oracle_data.capped_assets_data, asset
        );
        smart_table::remove(&mut price_oracle_data.capped_assets_data, asset);
        event::emit(PriceCapRemoved { asset, price_cap });
    }

    /// @notice Sets a Chainlink feed ID for an asset
    /// @param account Admin account that sets the feed
    /// @param asset Address of the asset
    /// @param feed_id Chainlink feed ID for the asset
    public entry fun set_asset_feed_id(
        account: &signer, asset: address, feed_id: vector<u8>
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        assert!(!vector::is_empty(&feed_id), error_config::get_eempty_feed_id());
        update_asset_feed_id(asset, feed_id);
    }

    /// @notice Sets a custom price for an asset
    /// @param account Admin account that sets the price
    /// @param asset Address of the asset
    /// @param custom_price Custom price value
    public entry fun set_asset_custom_price(
        account: &signer, asset: address, custom_price: u256
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        assert!(custom_price > 0, error_config::get_ezero_asset_custom_price());
        update_asset_custom_price(asset, custom_price);
    }

    /// @notice Sets Chainlink feed IDs for multiple assets at once
    /// @param account Admin account that sets the feeds
    /// @param assets Vector of asset addresses
    /// @param feed_ids Vector of corresponding feed IDs
    public entry fun batch_set_asset_feed_ids(
        account: &signer, assets: vector<address>, feed_ids: vector<vector<u8>>
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        assert!(
            vector::length(&assets) == vector::length(&feed_ids),
            error_config::get_erequested_feed_ids_assets_mistmatch()
        );
        for (i in 0..vector::length(&assets)) {
            let asset = *vector::borrow(&assets, i);
            let feed_id = *vector::borrow(&feed_ids, i);
            assert!(!vector::is_empty(&feed_id), error_config::get_eempty_feed_id());
            update_asset_feed_id(asset, feed_id);
        };
    }

    /// @notice Sets custom prices for multiple assets at once
    /// @param account Admin account that sets the prices
    /// @param assets Vector of asset addresses
    /// @param custom_prices Vector of corresponding custom prices
    public entry fun batch_set_asset_custom_prices(
        account: &signer, assets: vector<address>, custom_prices: vector<u256>
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        assert!(
            vector::length(&assets) == vector::length(&custom_prices),
            error_config::get_erequested_custom_prices_assets_mistmatch()
        );
        for (i in 0..vector::length(&assets)) {
            let asset = *vector::borrow(&assets, i);
            let custom_price = *vector::borrow(&custom_prices, i);
            assert!(custom_price > 0, error_config::get_ezero_asset_custom_price());
            update_asset_custom_price(asset, custom_price);
        };
    }

    /// @notice Removes a Chainlink feed ID for an asset
    /// @param account Admin account that removes the feed
    /// @param asset Address of the asset
    public entry fun remove_asset_feed_id(
        account: &signer, asset: address
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        let feed_id = assert_asset_feed_id_exists(asset);
        remove_feed_id(asset, feed_id);
    }

    /// @notice Removes a custom price for an asset
    /// @param account Admin account that removes the price
    /// @param asset Address of the asset
    public entry fun remove_asset_custom_price(
        account: &signer, asset: address
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        let custom_price = assert_asset_custom_price_exists(asset);
        remove_custom_price(asset, custom_price);
    }

    /// @notice Removes Chainlink feed IDs for multiple assets at once
    /// @param account Admin account that removes the feeds
    /// @param assets Vector of asset addresses
    public entry fun batch_remove_asset_feed_ids(
        account: &signer, assets: vector<address>
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        for (i in 0..vector::length(&assets)) {
            let asset = *vector::borrow(&assets, i);
            let feed_id = assert_asset_feed_id_exists(asset);
            remove_feed_id(asset, feed_id);
        };
    }

    /// @notice Removes custom prices for multiple assets at once
    /// @param account Admin account that removes the prices
    /// @param assets Vector of asset addresses
    public entry fun batch_remove_asset_custom_prices(
        account: &signer, assets: vector<address>
    ) acquires PriceOracleData {
        only_asset_listing_or_pool_admin(account);
        for (i in 0..vector::length(&assets)) {
            let asset = *vector::borrow(&assets, i);
            let custom_price = assert_asset_custom_price_exists(asset);
            remove_custom_price(asset, custom_price);
        };
    }

    // Private helper functions
    /// @dev Gets the price of an asset from either custom price or Chainlink feed
    /// @param asset Address of the asset
    /// @return The asset price
    fun get_asset_price_internal(asset: address): u256 acquires PriceOracleData {
        if (check_custom_price_exists(asset)) {
            let custom_price = get_asset_custom_price(asset);
            return custom_price;
        };

        if (check_price_feed_exists(asset)) {
            let feed_id = get_feed_id(asset);
            let benchmarks =
                chainlink_router::get_benchmarks(
                    &get_resource_account_signer(),
                    vector[feed_id],
                    vector[]
                );
            assert_benchmarks_match_assets(vector::length(&benchmarks), 1);
            let benchmark = vector::borrow(&benchmarks, 0);
            let price = chainlink::get_benchmark_value(benchmark);
            validate_oracle_price(price);
            return price;
        };

        assert!(false, error_config::get_easset_not_registered_with_oracle());
        0
    }

    /// @dev Validates that the oracle price is positive and within allowed range
    /// @param price The price to validate
    fun validate_oracle_price(price: u256) {
        assert!(
            price <= I192_MAX,
            error_config::get_enegative_oracle_price()
        );
        assert!(
            price > 0,
            error_config::get_ezero_oracle_price()
        );
    }

    /// @dev Checks that the account is either a pool admin or asset listing admin
    /// @param account The account to check
    fun only_asset_listing_or_pool_admin(account: &signer) {
        let account_address = signer::address_of(account);
        assert!(
            acl_manage::is_pool_admin(account_address)
                || acl_manage::is_asset_listing_admin(account_address),
            error_config::get_ecaller_not_pool_or_asset_listing_admin()
        );
    }

    /// @dev Checks that the account is either a pool admin or risk admin
    /// @param account The account to check
    fun only_risk_or_pool_admin(account: &signer) {
        let account_address = signer::address_of(account);
        assert!(
            acl_manage::is_pool_admin(account_address)
                || acl_manage::is_risk_admin(account_address),
            error_config::get_ecaller_not_risk_or_pool_admin()
        );
    }

    /// @dev Checks that the account is the oracle admin
    /// @param account The account to check
    fun only_oracle_admin(account: &signer) {
        assert!(
            signer::address_of(account) == @aave_oracle,
            error_config::get_eoracle_not_admin()
        );
    }

    /// @dev Gets the resource account signer
    /// @return The resource account signer
    fun get_resource_account_signer(): signer acquires PriceOracleData {
        let oracle_data = borrow_global<PriceOracleData>(oracle_address());
        account::create_signer_with_capability(&oracle_data.signer_cap)
    }

    /// @dev Updates the feed ID for an asset
    /// @param asset Address of the asset
    /// @param feed_id New feed ID
    fun update_asset_feed_id(asset: address, feed_id: vector<u8>) acquires PriceOracleData {
        let asset_price_list = borrow_global_mut<PriceOracleData>(oracle_address());
        smart_table::upsert(&mut asset_price_list.asset_feed_ids, asset, feed_id);
        emit_asset_price_feed_updated(asset, feed_id);
    }

    /// @dev Updates the custom price for an asset
    /// @param asset Address of the asset
    /// @param custom_price New custom price
    fun update_asset_custom_price(asset: address, custom_price: u256) acquires PriceOracleData {
        let asset_price_list = borrow_global_mut<PriceOracleData>(oracle_address());
        smart_table::upsert(
            &mut asset_price_list.custom_asset_prices, asset, custom_price
        );
        emit_asset_custom_price_updated(asset, custom_price);
    }

    /// @dev Checks that a feed ID exists for an asset and returns it
    /// @param asset Address of the asset
    /// @return The feed ID
    fun assert_asset_feed_id_exists(asset: address): vector<u8> acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        assert!(
            smart_table::contains(&asset_price_list.asset_feed_ids, asset),
            error_config::get_eno_asset_feed()
        );
        *smart_table::borrow(&asset_price_list.asset_feed_ids, asset)
    }

    /// @dev Checks that a custom price exists for an asset and returns it
    /// @param asset Address of the asset
    /// @return The custom price
    fun assert_asset_custom_price_exists(asset: address): u256 acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        assert!(
            smart_table::contains(&asset_price_list.custom_asset_prices, asset),
            error_config::get_eno_asset_custom_price()
        );
        *smart_table::borrow(&asset_price_list.custom_asset_prices, asset)
    }

    /// @dev Checks if a feed ID exists for an asset
    /// @param asset Address of the asset
    /// @return True if a feed ID exists
    fun check_price_feed_exists(asset: address): bool acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        if (smart_table::contains(&asset_price_list.asset_feed_ids, asset)) {
            return true;
        };
        false
    }

    /// @dev Checks if a custom price exists for an asset
    /// @param asset Address of the asset
    /// @return True if a custom price exists
    fun check_custom_price_exists(asset: address): bool acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        if (smart_table::contains(&asset_price_list.custom_asset_prices, asset)) {
            return true;
        };
        false
    }

    /// @dev Gets the feed ID for an asset
    /// @param asset Address of the asset
    /// @return The feed ID
    fun get_feed_id(asset: address): vector<u8> acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        *smart_table::borrow(&asset_price_list.asset_feed_ids, asset)
    }

    /// @dev Gets the custom price for an asset
    /// @param asset Address of the asset
    /// @return The custom price
    fun get_asset_custom_price(asset: address): u256 acquires PriceOracleData {
        let asset_price_list = borrow_global<PriceOracleData>(oracle_address());
        *smart_table::borrow(&asset_price_list.custom_asset_prices, asset)
    }

    /// @dev Removes the feed ID for an asset
    /// @param asset Address of the asset
    /// @param feed_id Feed ID to remove
    fun remove_feed_id(asset: address, feed_id: vector<u8>) acquires PriceOracleData {
        let asset_price_list = borrow_global_mut<PriceOracleData>(oracle_address());
        smart_table::remove(&mut asset_price_list.asset_feed_ids, asset);
        emit_asset_price_feed_removed(asset, feed_id);
    }

    /// @dev Removes the custom price for an asset
    /// @param asset Address of the asset
    /// @param custom_price Custom price to remove
    fun remove_custom_price(asset: address, custom_price: u256) acquires PriceOracleData {
        let asset_price_list = borrow_global_mut<PriceOracleData>(oracle_address());
        smart_table::remove(&mut asset_price_list.custom_asset_prices, asset);
        emit_asset_custom_price_removed(asset, custom_price);
    }

    /// @dev Emits an event when an asset price feed is updated
    /// @param asset Address of the asset
    /// @param feed_id New feed ID
    fun emit_asset_price_feed_updated(
        asset: address, feed_id: vector<u8>
    ) {
        event::emit(AssetPriceFeedUpdated { asset, feed_id })
    }

    /// @dev Emits an event when an asset custom price is updated
    /// @param asset Address of the asset
    /// @param custom_price New custom price
    fun emit_asset_custom_price_updated(
        asset: address, custom_price: u256
    ) {
        event::emit(AssetCustomPriceUpdated { asset, custom_price })
    }

    /// @dev Emits an event when an asset price feed is removed
    /// @param asset Address of the asset
    /// @param feed_id Removed feed ID
    fun emit_asset_price_feed_removed(
        asset: address, feed_id: vector<u8>
    ) {
        event::emit(AssetPriceFeedRemoved { asset, feed_id })
    }

    /// @dev Emits an event when an asset custom price is removed
    /// @param asset Address of the asset
    /// @param custom_price Removed custom price
    fun emit_asset_custom_price_removed(
        asset: address, custom_price: u256
    ) {
        event::emit(AssetCustomPriceRemoved { asset, custom_price })
    }

    /// @dev Verifies that the number of benchmarks matches the number of requested assets
    /// @param benchmarks_len Number of benchmarks
    /// @param requested_assets Number of requested assets
    fun assert_benchmarks_match_assets(
        benchmarks_len: u64, requested_assets: u64
    ) {
        assert!(
            benchmarks_len == requested_assets,
            error_config::get_eoralce_benchmark_length_mistmatch()
        );
    }

    // Test-only functions
    #[test_only]
    /// @dev Sets a mock price for a Chainlink feed
    /// @param account Admin account
    /// @param price Mock price
    /// @param feed_id Feed ID to set the price for
    public entry fun set_chainlink_mock_price(
        account: &signer, price: u256, feed_id: vector<u8>
    ) {
        only_asset_listing_or_pool_admin(account);
        assert!(!vector::is_empty(&feed_id), error_config::get_eempty_feed_id());

        // set the price on chainlink
        let feed_timestamp = (timestamp::now_seconds() * 1000) as u256;
        chainlink::perform_update_for_test(
            feed_id,
            feed_timestamp,
            price,
            vector::empty<u8>()
        );
    }

    #[test_only]
    /// @dev Sets a mock Chainlink feed for an asset
    /// @param account Admin account
    /// @param asset Asset address
    /// @param feed_id Feed ID to set
    public entry fun set_chainlink_mock_feed(
        account: &signer, asset: address, feed_id: vector<u8>
    ) {
        only_asset_listing_or_pool_admin(account);
        assert!(!vector::is_empty(&feed_id), error_config::get_eempty_feed_id());

        // set the asset feed id in the oracle
        let feeds_len = chainlink::get_feeds_len();
        let config_id = vector[(feeds_len + 1) as u8];
        chainlink::set_feed_for_test(
            feed_id,
            format1(&b"feed_{}", asset),
            config_id
        );
    }

    #[test_only]
    /// @dev Initializes the module for testing
    /// @param account Admin account
    public fun test_init_module(account: &signer) {
        init_module(account);
    }

    #[test_only]
    /// @dev Gets the resource account signer for testing
    /// @return The resource account signer
    public fun get_resource_account_signer_for_testing(): signer acquires PriceOracleData {
        get_resource_account_signer()
    }

    #[test_only]
    /// @dev Sets an asset feed ID for testing
    /// @param asset Asset address
    /// @param feed_id Feed ID to set
    public fun test_set_asset_feed_id(
        asset: address, feed_id: vector<u8>
    ) acquires PriceOracleData {
        update_asset_feed_id(asset, feed_id);
    }

    #[test_only]
    /// @dev Sets a custom price for testing
    /// @param asset Asset address
    /// @param custom_price Custom price to set
    public fun test_set_asset_custom_price(
        asset: address, custom_price: u256
    ) acquires PriceOracleData {
        update_asset_custom_price(asset, custom_price);
    }

    #[test_only]
    /// @dev Gets a feed ID for testing
    /// @param asset Asset address
    /// @return The feed ID
    public fun test_get_feed_id(asset: address): vector<u8> acquires PriceOracleData {
        get_feed_id(asset)
    }

    #[test_only]
    /// @dev Gets a custom price for testing
    /// @param asset Asset address
    /// @return The custom price
    public fun test_get_asset_custom_price(asset: address): u256 acquires PriceOracleData {
        get_asset_custom_price(asset)
    }

    #[test_only]
    /// @dev Removes a feed ID for testing
    /// @param asset Asset address
    /// @param feed_id Feed ID to remove
    public fun test_remove_feed_id(asset: address, feed_id: vector<u8>) acquires PriceOracleData {
        remove_feed_id(asset, feed_id)
    }

    #[test_only]
    /// @dev Removes a custom price for testing
    /// @param asset Asset address
    /// @param custom_price Custom price to remove
    public fun test_remove_asset_custom_price(
        asset: address, custom_price: u256
    ) acquires PriceOracleData {
        remove_custom_price(asset, custom_price)
    }

    #[test_only]
    /// @dev Tests the admin role check
    /// @param account Account to check
    public fun test_only_risk_or_pool_admin(account: &signer) {
        only_asset_listing_or_pool_admin(account);
    }

    #[test_only]
    /// @dev Tests asset feed ID existence check
    /// @param asset Asset address
    /// @return The feed ID
    public fun test_assert_asset_feed_id_exists(asset: address): vector<u8> acquires PriceOracleData {
        assert_asset_feed_id_exists(asset)
    }

    #[test_only]
    /// @dev Tests asset custom price existence check
    /// @param asset Asset address
    /// @return The custom price
    public fun test_assert_asset_custom_price_exists(asset: address): u256 acquires PriceOracleData {
        assert_asset_custom_price_exists(asset)
    }

    #[test_only]
    /// @dev Initializes the oracle for testing
    /// @param account Admin account
    public fun test_init_oracle(account: &signer) {
        init_module(account);
    }

    #[test_only]
    /// @dev Tests benchmark matching
    /// @param benchmarks_len Number of benchmarks
    /// @param requested_assets Number of requested assets
    public fun test_assert_benchmarks_match_assets(
        benchmarks_len: u64, requested_assets: u64
    ) {
        assert_benchmarks_match_assets(benchmarks_len, requested_assets)
    }

    #[test_only]
    /// @dev Tests oracle admin check
    /// @param account Account to check
    public fun test_only_oracle_admin(account: &signer) {
        only_oracle_admin(account)
    }

    #[test_only]
    /// @dev Tests asset price feed updated event
    /// @param asset Asset address
    /// @param feed_id Feed ID
    public fun test_emit_asset_price_feed_updated(
        asset: address, feed_id: vector<u8>
    ) {
        emit_asset_price_feed_updated(asset, feed_id);
    }

    #[test_only]
    /// @dev Tests asset price feed removed event
    /// @param asset Asset address
    /// @param feed_id Feed ID
    public fun test_emit_asset_price_feed_removed(
        asset: address, feed_id: vector<u8>
    ) {
        emit_asset_price_feed_removed(asset, feed_id);
    }
}
