module aave_pool::ui_pool_data_provider_v3 {
    use std::option::Self;
    use std::string::String;
    use std::vector;
    use aptos_framework::object::{Self, Object};

    use aave_config::reserve as reserve_config;
    use aave_config::user::Self as user_config;
    use aave_mock_oracle::oracle::{get_asset_price, get_base_currency_unit};
    use aave_pool::mock_underlying_token_factory::Self;
    use aave_pool::a_token_factory;
    use aave_pool::default_reserve_interest_rate_strategy::{
        get_base_variable_borrow_rate,
        get_optimal_usage_ratio,
        get_variable_rate_slope1,
        get_variable_rate_slope2,
    };
    use aave_pool::eac_aggregator_proxy::{
        create_eac_aggregator_proxy,
        decimals,
        latest_answer,
        MockEacAggregatorProxy
    };
    use aave_pool::emode_logic;
    use aave_pool::pool::{
        Self,
        get_reserve_a_token_address,
        get_reserve_accrued_to_treasury,
        get_reserve_current_liquidity_rate,
        get_reserve_current_variable_borrow_rate,
        get_reserve_isolation_mode_total_debt,
        get_reserve_last_update_timestamp,
        get_reserve_liquidity_index,
        get_reserve_unbacked,
        get_reserve_variable_borrow_index,
        get_reserve_variable_debt_token_address
    };
    use aave_pool::token_base;
    use aave_pool::variable_debt_token_factory;

    const EMPTY_ADDRESS: address = @0x0;

    const ETH_CURRENCY_UNIT: u256 = 1;

    const EROLE_NOT_EXISTS: u64 = 1;
    const ESTREAM_NOT_EXISTS: u64 = 2;
    const NOT_FUNDS_ADMIN: u64 = 3;
    const ESTREAM_TO_THE_CONTRACT_ITSELF: u64 = 4;
    const ESTREAM_TO_THE_CALLER: u64 = 5;
    const EDEPOSIT_IS_ZERO: u64 = 6;
    const ESTART_TIME_BEFORE_BLOCK_TIMESTAMP: u64 = 7;
    const ESTOP_TIME_BEFORE_THE_START_TIME: u64 = 8;
    const EDEPOSIT_SMALLER_THAN_TIME_DELTA: u64 = 9;
    const EDEPOSIT_NOT_MULTIPLE_OF_TIME_DELTA: u64 = 10;
    const EAMOUNT_IS_ZERO: u64 = 11;
    const EAMOUNT_EXCEEDS_THE_AVAILABLE_BALANCE: u64 = 12;

    const UI_POOL_DATA_PROVIDER_V3_NAME: vector<u8> = b"AAVE_UI_POOL_DATA_PROVIDER_V3";

    struct UiPoolDataProviderV3Data has key {
        network_base_token_price_in_usd_proxy_aggregator: MockEacAggregatorProxy,
        market_reference_currency_price_in_usd_proxy_aggregator: MockEacAggregatorProxy,
    }

    struct AggregatedReserveData has key, store, drop {
        underlying_asset: address,
        name: String,
        symbol: String,
        decimals: u256,
        base_lt_vas_collateral: u256,
        reserve_liquidation_threshold: u256,
        reserve_liquidation_bonus: u256,
        reserve_factor: u256,
        usage_as_collateral_enabled: bool,
        borrowing_enabled: bool,
        is_active: bool,
        is_frozen: bool,
        // base data
        liquidity_index: u128,
        variable_borrow_index: u128,
        liquidity_rate: u128,
        variable_borrow_rate: u128,
        last_update_timestamp: u128,
        a_token_address: address,
        variable_debt_token_address: address,
        //
        available_liquidity: u256,
        total_scaled_variable_debt: u256,
        price_in_market_reference_currency: u256,
        price_oracle: address,
        variable_rate_slope1: u256,
        variable_rate_slope2: u256,
        base_variable_borrow_rate: u256,
        optimal_usage_ratio: u256,
        // v3 only
        is_paused: bool,
        is_siloed_borrowing: bool,
        accrued_to_treasury: u128,
        unbacked: u128,
        isolation_mode_total_debt: u128,
        flash_loan_enabled: bool,
        //
        debt_ceiling: u256,
        debt_ceiling_decimals: u256,
        e_mode_category_id: u8,
        borrow_cap: u256,
        supply_cap: u256,
        // e_mode
        e_mode_ltv: u16,
        e_mode_liquidation_threshold: u16,
        e_mode_liquidation_bonus: u16,
        e_mode_price_source: address,
        e_mode_label: String,
        borrowable_in_isolation: bool
    }

    struct UserReserveData has key, store, drop {
        underlying_asset: address,
        scaled_a_token_balance: u256,
        usage_as_collateral_enabled_on_user: bool,
        scaled_variable_debt: u256,
    }

    struct BaseCurrencyInfo has key, store, drop {
        market_reference_currency_unit: u256,
        market_reference_currency_price_in_usd: u256,
        network_base_token_price_in_usd: u256,
        network_base_token_price_decimals: u8,
    }

    fun init_module(sender: &signer,) {
        let state_object_constructor_ref =
            &object::create_named_object(sender, UI_POOL_DATA_PROVIDER_V3_NAME);
        let state_object_signer = &object::generate_signer(state_object_constructor_ref);

        move_to(
            state_object_signer,
            UiPoolDataProviderV3Data {
                network_base_token_price_in_usd_proxy_aggregator: create_eac_aggregator_proxy(),
                market_reference_currency_price_in_usd_proxy_aggregator: create_eac_aggregator_proxy(),
            },
        );
    }

    #[test_only]
    public fun init_module_test(sender: &signer) {
        init_module(sender);
    }

    #[view]
    public fun ui_pool_data_provider_v3_data_address(): address {
        object::create_object_address(&@aave_pool, UI_POOL_DATA_PROVIDER_V3_NAME)
    }

    #[view]
    public fun ui_pool_data_provider_v3_data_object(): Object<UiPoolDataProviderV3Data> {
        object::address_to_object<UiPoolDataProviderV3Data>(
            ui_pool_data_provider_v3_data_address()
        )
    }

    #[view]
    public fun get_reserves_list(): vector<address> {
        pool::get_reserves_list()
    }

    #[view]
    public fun get_reserves_data(): (vector<AggregatedReserveData>, BaseCurrencyInfo) {
        // TODO Waiting for Chainlink oracle functionality
        let oracle = @aave_mock_oracle;

        let reserves = pool::get_reserves_list();

        let reserves_data = vector::empty<AggregatedReserveData>();

        for (i in 0..vector::length(&reserves)) {
            let underlying_asset = *vector::borrow(&reserves, i);

            let base_data = pool::get_reserve_data(underlying_asset);

            let liquidity_index = get_reserve_liquidity_index(&base_data);
            let variable_borrow_index = get_reserve_variable_borrow_index(&base_data);
            let liquidity_rate = get_reserve_current_liquidity_rate(&base_data);
            let variable_borrow_rate =
                get_reserve_current_variable_borrow_rate(&base_data);
            let last_update_timestamp = get_reserve_last_update_timestamp(&base_data);
            let a_token_address = get_reserve_a_token_address(&base_data);
            let variable_debt_token_address =
                get_reserve_variable_debt_token_address(&base_data);
            let price_in_market_reference_currency = get_asset_price(underlying_asset);

            let price_oracle = oracle;

            let available_liquidity =
                mock_underlying_token_factory::balance_of(
                    a_token_address, underlying_asset
                );

            let total_scaled_variable_debt =
                token_base::scaled_total_supply(variable_debt_token_address);

            let symbol = mock_underlying_token_factory::symbol(underlying_asset);
            let name = mock_underlying_token_factory::name(underlying_asset);

            let reserve_configuration_map =
                pool::get_reserve_configuration_by_reserve_data(&base_data);

            let (
                base_lt_vas_collateral,
                reserve_liquidation_threshold,
                reserve_liquidation_bonus,
                decimals,
                reserve_factor,
                e_mode_category_id
            ) = reserve_config::get_params(&reserve_configuration_map);
            let usage_as_collateral_enabled = base_lt_vas_collateral != 0;

            let (is_active, is_frozen, borrowing_enabled, is_paused) =
                reserve_config::get_flags(&reserve_configuration_map);

            let variable_rate_slope1 = get_variable_rate_slope1(underlying_asset);
            let variable_rate_slope2 = get_variable_rate_slope2(underlying_asset);
            let base_variable_borrow_rate =
                get_base_variable_borrow_rate(underlying_asset);
            let optimal_usage_ratio = get_optimal_usage_ratio(underlying_asset);

            let debt_ceiling: u256 =
                reserve_config::get_debt_ceiling(&reserve_configuration_map);
            let debt_ceiling_decimals = reserve_config::get_debt_ceiling_decimals();
            let (borrow_cap, supply_cap) =
                reserve_config::get_caps(&reserve_configuration_map);

            let flash_loan_enabled =
                reserve_config::get_flash_loan_enabled(&reserve_configuration_map);

            let is_siloed_borrowing =
                reserve_config::get_siloed_borrowing(&reserve_configuration_map);
            let unbacked = get_reserve_unbacked(&base_data);
            let isolation_mode_total_debt =
                get_reserve_isolation_mode_total_debt(&base_data);
            let accrued_to_treasury = get_reserve_accrued_to_treasury(&base_data);

            let e_mode_category_id_u8 = (e_mode_category_id as u8);

            let (e_mode_ltv, e_mode_liquidation_threshold, _) =
                emode_logic::get_emode_configuration(e_mode_category_id_u8);

            let e_mode_liquidation_bonus =
                emode_logic::get_emode_e_mode_liquidation_bonus(e_mode_category_id_u8);
            let e_mode_price_source =
                emode_logic::get_emode_e_mode_price_source(e_mode_category_id_u8);
            let e_mode_label = emode_logic::get_emode_e_mode_label(e_mode_category_id_u8);

            let borrowable_in_isolation =
                reserve_config::get_borrowable_in_isolation(&reserve_configuration_map);

            let aggregated_reserve_data = AggregatedReserveData {
                underlying_asset,
                name,
                symbol,
                decimals,
                base_lt_vas_collateral,
                reserve_liquidation_threshold,
                reserve_liquidation_bonus,
                reserve_factor,
                usage_as_collateral_enabled,
                borrowing_enabled,
                is_active,
                is_frozen,
                liquidity_index,
                variable_borrow_index,
                liquidity_rate,
                variable_borrow_rate,
                last_update_timestamp: (last_update_timestamp as u128),
                a_token_address,
                variable_debt_token_address,
                available_liquidity: (available_liquidity as u256),
                total_scaled_variable_debt,
                price_in_market_reference_currency,
                price_oracle,
                variable_rate_slope1,
                variable_rate_slope2,
                base_variable_borrow_rate,
                optimal_usage_ratio,
                is_paused,
                is_siloed_borrowing,
                accrued_to_treasury: (accrued_to_treasury as u128),
                unbacked,
                isolation_mode_total_debt,
                flash_loan_enabled,
                debt_ceiling,
                debt_ceiling_decimals,
                e_mode_category_id: e_mode_category_id_u8,
                borrow_cap,
                supply_cap,
                e_mode_ltv: (e_mode_ltv as u16),
                e_mode_liquidation_threshold: (e_mode_liquidation_threshold as u16),
                e_mode_liquidation_bonus,
                e_mode_price_source,
                e_mode_label,
                borrowable_in_isolation
            };

            vector::push_back(&mut reserves_data, aggregated_reserve_data);
        };

        let network_base_token_price_in_usd = latest_answer();
        let network_base_token_price_decimals = decimals();

        let opt_base_currency_unit = get_base_currency_unit();

        let market_reference_currency_unit =
            if (option::is_some(&opt_base_currency_unit)) {
                *option::borrow(&opt_base_currency_unit)
            } else {
                ETH_CURRENCY_UNIT
            };

        let market_reference_currency_price_in_usd =
            if (option::is_some(&opt_base_currency_unit)) {
                *option::borrow(&opt_base_currency_unit)
            } else {
                latest_answer()
            };

        let base_currency_info = BaseCurrencyInfo {
            market_reference_currency_unit,
            market_reference_currency_price_in_usd,
            network_base_token_price_in_usd,
            network_base_token_price_decimals,
        };
        (reserves_data, base_currency_info)
    }

    #[view]
    public fun get_user_reserves_data(user: address): (vector<UserReserveData>, u8) {
        let reserves = pool::get_reserves_list();
        let user_config = pool::get_user_configuration(user);

        let user_emode_category_id = emode_logic::get_user_emode(user);

        let user_reserves_data = vector::empty<UserReserveData>();

        for (i in 0..vector::length(&reserves)) {
            let underlying_asset = *vector::borrow(&reserves, i);

            let base_data = pool::get_reserve_data(underlying_asset);

            let scaled_a_token_balance =
                a_token_factory::scaled_balance_of(
                    user, pool::get_reserve_a_token_address(&base_data)
                );

            let usage_as_collateral_enabled_on_user =
                user_config::is_using_as_collateral(&user_config, (i as u256));

            let scaled_variable_debt = 0;
            if (user_config::is_borrowing(&user_config, (i as u256))) {
                scaled_variable_debt = variable_debt_token_factory::scaled_balance_of(
                    pool::get_reserve_variable_debt_token_address(&base_data), user
                );
            };

            vector::push_back(
                &mut user_reserves_data,
                UserReserveData {
                    underlying_asset,
                    scaled_a_token_balance,
                    usage_as_collateral_enabled_on_user,
                    scaled_variable_debt,
                },
            );
        };

        (user_reserves_data, (user_emode_category_id as u8))
    }
}
