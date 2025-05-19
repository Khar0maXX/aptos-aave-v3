// @title Pool Reserves Setup Script
// @author Aave
// @notice Script to initialize reserves in the Aave pool with appropriate tokens and parameters
script {
    // imports
    // std
    use std::option;
    use std::option::Option;
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_std::debug::print;
    use aptos_std::string_utils::format1;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object::Self;
    // locals
    use aave_pool::collector;
    use aave_pool::pool::Self;
    use aave_pool::pool_configurator;
    use aave_pool::a_token_factory::Self;
    use aave_pool::variable_debt_token_factory::Self;
    use aave_acl::acl_manage::Self;
    use aave_config::error_config;
    use aave_pool::pool_data_provider;

    // Constants
    // @notice Network identifier for Aptos mainnet
    const APTOS_MAINNET: vector<u8> = b"mainnet";

    // @notice Network identifier for Aptos testnet
    const APTOS_TESTNET: vector<u8> = b"testnet";

    // @notice Success code for deployment verification
    const DEPLOYMENT_SUCCESS: u64 = 1;

    // @notice Failure code for deployment verification
    const DEPLOYMENT_FAILURE: u64 = 2;

    /// @notice Main function to set up pool reserves with appropriate tokens and parameters
    /// @param account The signer account executing the script (must be an asset listing admin or pool admin)
    /// @param network The network identifier ("mainnet" or "testnet")
    fun main(account: &signer, network: String) {
        // Verify the caller has appropriate permissions
        assert!(
            acl_manage::is_asset_listing_admin(signer::address_of(account))
                || acl_manage::is_pool_admin(signer::address_of(account)),
            error_config::get_ecaller_not_asset_listing_or_pool_admin()
        );

        // Get underlying assets based on the specified network
        let (underlying_asset_keys, underlying_assets_addresses) =
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

        // Initialize vectors to store reserve configuration data
        let treasuries: vector<address> = vector[];
        let underlying_assets: vector<address> = vector[];
        let underlying_assets_decimals: vector<u8> = vector[];
        let atokens_names: vector<String> = vector[];
        let atokens_symbols: vector<String> = vector[];
        let var_tokens_names: vector<String> = vector[];
        let var_tokens_symbols: vector<String> = vector[];
        let optimal_usage_ratios: vector<u256> = vector[];
        let incentives_controllers: vector<Option<address>> = vector[];
        let base_variable_borrow_rates: vector<u256> = vector[];
        let variable_rate_slope1s: vector<u256> = vector[];
        let variable_rate_slope2s: vector<u256> = vector[];
        let collector_address = collector::collector_address();

        // Get interest rate strategies based on the specified network
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

        // Prepare configuration data for each reserve
        for (i in 0..vector::length(&underlying_asset_keys)) {
            // Get underlying asset metadata
            let underlying_asset_address =
                *vector::borrow(&underlying_assets_addresses, i);
            let underlying_asset_metadata =
                object::address_to_object<Metadata>(underlying_asset_address);
            let underlying_asset_symbol =
                fungible_asset::symbol(underlying_asset_metadata);
            let underlying_asset_decimals =
                fungible_asset::decimals(underlying_asset_metadata);

            // Add underlying asset information to configuration vectors
            vector::push_back(&mut underlying_assets, underlying_asset_address);
            vector::push_back(
                &mut underlying_assets_decimals,
                underlying_asset_decimals
            );
            vector::push_back(&mut treasuries, collector_address);
            vector::push_back(&mut incentives_controllers, option::none()); // NOTE: currently no incentives controller is being set

            // Set up aToken and variable debt token names and symbols
            vector::push_back(
                &mut atokens_names,
                aave_data::v1::get_atoken_name(underlying_asset_symbol)
            );
            vector::push_back(
                &mut atokens_symbols,
                aave_data::v1::get_atoken_symbol(underlying_asset_symbol)
            );
            vector::push_back(
                &mut var_tokens_names,
                aave_data::v1::get_vartoken_name(underlying_asset_symbol)
            );
            vector::push_back(
                &mut var_tokens_symbols,
                aave_data::v1::get_vartoken_symbol(underlying_asset_symbol)
            );

            // Get interest rate strategy parameters
            let interest_rate_strategy_map = vector::borrow(
                &interest_rate_strategy_maps, i
            );
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

            // Add interest rate parameters to configuration vectors
            vector::push_back(&mut optimal_usage_ratios, optimal_usage_ratio);
            vector::push_back(
                &mut base_variable_borrow_rates, base_variable_borrow_rate
            );
            vector::push_back(&mut variable_rate_slope1s, variable_rate_slope1);
            vector::push_back(&mut variable_rate_slope2s, variable_rate_slope2);
        };

        // Initialize all reserves in a single transaction
        print(&format1(&b"Initializing reserves ... {}", 1));
        pool_configurator::init_reserves(
            account,
            underlying_assets,
            treasuries,
            atokens_names,
            atokens_symbols,
            var_tokens_names,
            var_tokens_symbols,
            incentives_controllers,
            optimal_usage_ratios,
            base_variable_borrow_rates,
            variable_rate_slope1s,
            variable_rate_slope2s
        );
        print(&format1(&b"Finished initializing reserves! {}", 1));
        // ===== Verify deployment was successful ===== //

        // Verify all reserves are present
        assert!(
            vector::length(&pool::get_reserves_list())
                == vector::length(&underlying_assets_addresses),
            DEPLOYMENT_SUCCESS
        );

        // Verify all reserves are active
        assert!(
            pool::number_of_active_reserves()
                == (vector::length(&underlying_assets_addresses) as u256),
            DEPLOYMENT_SUCCESS
        );

        // Verify no reserves have been dropped
        assert!(
            pool::number_of_active_and_dropped_reserves()
                == (vector::length(&underlying_assets_addresses) as u256),
            DEPLOYMENT_SUCCESS
        );

        // Verify each reserve has corresponding aToken and variable debt token
        assert!(
            vector::length(&pool_data_provider::get_all_a_tokens())
                == vector::length(&underlying_assets_addresses),
            DEPLOYMENT_SUCCESS
        );
        assert!(
            vector::length(&pool_data_provider::get_all_var_tokens())
                == vector::length(&underlying_assets_addresses),
            DEPLOYMENT_SUCCESS
        );
        assert!(
            vector::length(&pool_data_provider::get_all_reserves_tokens())
                == vector::length(&underlying_assets_addresses),
            DEPLOYMENT_SUCCESS
        );

        // Verify individual reserve details
        for (i in 0..vector::length(&underlying_assets_addresses)) {
            // Get underlying asset address
            let underlying_asset_address =
                *vector::borrow(&underlying_assets_addresses, i);

            // Verify asset exists in pool
            assert!(pool::asset_exists(underlying_asset_address), DEPLOYMENT_SUCCESS);

            // Get reserve data and associated token addresses
            let reserve_data = pool::get_reserve_data(underlying_asset_address);
            let a_token_address = pool::get_reserve_a_token_address(reserve_data);
            let var_token_address =
                pool::get_reserve_variable_debt_token_address(reserve_data);

            // Verify no accrued interest to treasury at deployment
            assert!(
                pool::get_reserve_accrued_to_treasury(reserve_data) == 0,
                DEPLOYMENT_SUCCESS
            );

            // Verify token contracts are properly deployed
            assert!(a_token_factory::is_atoken(a_token_address), DEPLOYMENT_SUCCESS);
            assert!(
                variable_debt_token_factory::is_variable_debt_token(var_token_address),
                DEPLOYMENT_SUCCESS
            );

            // Verify no collected fees at deployment
            assert!(
                collector::get_collected_fees(a_token_address) == 0, DEPLOYMENT_SUCCESS
            );
        }
    }
}
