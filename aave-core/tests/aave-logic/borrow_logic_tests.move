#[test_only]
module aave_pool::borrow_logic_tests {
    use std::signer;
    use std::string::{utf8};
    use std::vector;
    use aptos_framework::event::emitted_events;
    use aptos_framework::timestamp;
    use aave_config::reserve_config;
    use aave_math::math_utils;
    use aave_pool::default_reserve_interest_rate_strategy;
    use aave_pool::fungible_asset_manager;
    use aave_pool::variable_debt_token_factory;
    use aave_pool::pool_token_logic;
    use aave_pool::token_helper::{convert_to_currency_decimals, init_reserves_with_oracle};
    use aave_pool::pool;
    use aave_pool::token_helper;
    use aave_pool::a_token_factory::Self;
    use aave_pool::borrow_logic::Self;
    use aave_mock_underlyings::mock_underlying_token_factory::Self;
    use aave_pool::events::IsolationModeTotalDebtUpdated;
    use aave_pool::pool_data_provider;
    use aave_pool::pool_configurator;
    use aave_pool::supply_logic::Self;

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            supply_user = @0x042
        )
    ]
    /// Reserve allows borrowing and being used as collateral.
    /// User config allows only borrowing for the reserve.
    /// User supplies and withdraws parts of the supplied amount
    fun test_supply_borrow(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        supply_user: &signer
    ) {
        let supply_user_address = signer::address_of(supply_user);
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);

        // user1 mint 1000 U_1
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            supply_user_address,
            (convert_to_currency_decimals(underlying_u1_token_address, 1000) as u64),
            underlying_u1_token_address
        );

        // mint 10 APT to the supply_user_address
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            supply_user_address, 1_000_000_000
        );

        // set asset price for U_1 token
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        // user1 deposit 1000 U_1 to the pool
        let supply_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 1000);
        supply_logic::supply(
            supply_user,
            underlying_u1_token_address,
            supply_u1_amount,
            supply_user_address,
            0
        );

        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        let user1_balance =
            a_token_factory::balance_of(supply_user_address, a_token_address);
        assert!(user1_balance == supply_u1_amount, TEST_SUCCESS);

        // set global time
        timestamp::update_global_time_for_test_secs(1000);

        // user1 borrow 100 U_1
        let borrow_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 100);
        borrow_logic::borrow(
            supply_user,
            underlying_u1_token_address,
            borrow_u1_amount,
            2,
            0,
            supply_user_address
        );

        // check emitted events
        let emitted_borrow_events = emitted_events<borrow_logic::Borrow>();
        assert!(vector::length(&emitted_borrow_events) == 1, TEST_SUCCESS);
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aave_std = @std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x41,
            user2 = @0x42
        )
    ]
    // User 1 supply 1000 U_1
    // User 2 supply 2000 U_2
    // Configures isolated assets U_2.
    // User 2 borrows 10 U_1. Check debt ceiling
    fun test_borrow_with_isolation_mode(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aave_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aave_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));

        // mint 10000000 U_1 to user 1
        let mint_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 10000000);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_u1_amount as u64),
            underlying_u1_token_address
        );

        // set asset price for U_1
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            10
        );

        // supply 1000 U_1 to user 1
        let supply_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 1000);
        aave_pool::supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_u1_amount,
            user1_address,
            0
        );

        // mint 10000000 U_2 to user 2
        let mint_u2_amount =
            convert_to_currency_decimals(underlying_u2_token_address, 10000000);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_u2_amount as u64),
            underlying_u2_token_address
        );

        // set asset price for U_2
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            10
        );

        // set debt ceiling
        pool_configurator::set_debt_ceiling(
            aave_pool, underlying_u2_token_address, 10000
        );

        // supply 2000 U_2 to user 2
        let supply_u2_amount =
            convert_to_currency_decimals(underlying_u2_token_address, 2000);
        aave_pool::supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_u2_amount,
            user2_address,
            0
        );
        // Enables collateral
        supply_logic::set_user_use_reserve_as_collateral(
            user2, underlying_u2_token_address, true
        );

        let (_, _, _, _, usage_as_collateral_enabled) =
            pool_data_provider::get_user_reserve_data(
                underlying_u2_token_address, user2_address
            );
        assert!(usage_as_collateral_enabled == true, TEST_SUCCESS);

        // set global time
        timestamp::update_global_time_for_test_secs(1000);

        // set borrowable in isolation
        pool_configurator::set_borrowable_in_isolation(
            aave_pool, underlying_u1_token_address, true
        );

        // User 2 borrow 10 U_1 to user 2
        let borrow_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 10);
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_u1_amount,
            2,
            0,
            user2_address
        );

        // check isolation mode total debt emitted events
        let emitted_events = emitted_events<IsolationModeTotalDebtUpdated>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 1, TEST_SUCCESS);

        // check borrow event
        let emitted_events = emitted_events<borrow_logic::Borrow>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 1, TEST_SUCCESS);

        let reserve_data = pool::get_reserve_data(underlying_u2_token_address);
        let isolation_mode_total_debt =
            pool::get_reserve_isolation_mode_total_debt(reserve_data);

        assert!(isolation_mode_total_debt == 1000, TEST_SUCCESS);
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x041,
            user2 = @0x042
        )
    ]
    // User 1 deposits 1000 U_1
    // User 2 deposits 1000 U_2
    // User 2 borrows 1 U_1
    // User 2 borrows 1 U_1 again
    // User 2 borrows 1 U_1 again
    // User 2 borrows 1 U_1 again
    // See if there is any arbitrage possibility
    fun test_borrow_with_multiple_borrow(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        // mint 1000 U_1 for user 1
        let mint_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 1000
        );
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_amount as u64),
            underlying_u1_token_address
        );
        // user 1 supplies 100 U_1
        let supply_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 1000);
        supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_amount,
            user1_address,
            0
        );

        // set asset price for U_1
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        // mint 1000 U_2 for user 2
        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));
        let mint_amount = convert_to_currency_decimals(
            underlying_u2_token_address, 1000
        );
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_amount as u64),
            underlying_u2_token_address
        );
        // user 2 supplies 1000 U_2
        let supply_amount =
            convert_to_currency_decimals(underlying_u2_token_address, 1000);
        supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_amount,
            user2_address,
            0
        );

        // set asset price for U_2
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            100
        );

        // set global time
        timestamp::fast_forward_seconds(1000);

        let borrow_amount = convert_to_currency_decimals(underlying_u1_token_address, 1);
        // set variable borrow index is 1.5 ray
        let variable_borrow_index = 15 * math_utils::pow(10, 26);
        pool::set_reserve_variable_borrow_index_for_testing(
            underlying_u1_token_address,
            (variable_borrow_index as u128)
        );

        // user 2 first borrows 1 U_1
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 2 second borrows 1 U_1
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 2 third borrows 1 U_1
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 2 fourth borrows 1 U_1
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // repay all debt
        let repay_amount = borrow_amount * 4;
        // check total debt before repay
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);
        let total_debt =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(total_debt > repay_amount, TEST_SUCCESS);

        borrow_logic::repay(
            user2,
            underlying_u1_token_address,
            repay_amount,
            2, // variable interest rate mode
            user2_address
        );

        // check total debt after repay
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);
        let total_debt =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(total_debt > 0, TEST_SUCCESS); // There is still debt to be repaid, No arbitrage possible

        // check emitted events
        let emitted_borrow_events = emitted_events<borrow_logic::Borrow>();
        assert!(vector::length(&emitted_borrow_events) == 4, TEST_SUCCESS);
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aave_std = @std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x41,
            user2 = @0x42
        )
    ]
    // User 1 supply 1000 U_1
    // User 2 supplies U_2 and borrows U_1 in isolation, U_2 exits isolation.
    // User 2 repay. U_2 enters isolation again
    fun test_repay_with_isolation_mode(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aave_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aave_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));
        // set borrowable in isolation for U_1
        pool_configurator::set_borrowable_in_isolation(
            aave_pool, underlying_u1_token_address, true
        );

        // set debt ceiling for U_2
        pool_configurator::set_debt_ceiling(
            aave_pool, underlying_u2_token_address, 10000
        );

        // mint 10000000 U_1 to user 1
        let mint_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 10000000);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_u1_amount as u64),
            underlying_u1_token_address
        );

        // set asset price for U_1
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            10
        );

        // supply 1000 U_1 to user 1
        let supply_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 1000);
        aave_pool::supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_u1_amount,
            user1_address,
            0
        );

        // mint 10000000 U_2 to user 2
        let mint_u2_amount =
            convert_to_currency_decimals(underlying_u2_token_address, 10000000);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_u2_amount as u64),
            underlying_u2_token_address
        );

        // set asset price for U_2
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            10
        );

        // supply 2000 U_2 to user 2
        let supply_u2_amount =
            convert_to_currency_decimals(underlying_u2_token_address, 2000);
        aave_pool::supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_u2_amount,
            user2_address,
            0
        );

        // Enables collateral
        supply_logic::set_user_use_reserve_as_collateral(
            user2, underlying_u2_token_address, true
        );

        let (_, _, _, _, usage_as_collateral_enabled) =
            pool_data_provider::get_user_reserve_data(
                underlying_u2_token_address, user2_address
            );

        assert!(usage_as_collateral_enabled == true, TEST_SUCCESS);

        // set global time
        timestamp::update_global_time_for_test_secs(1000);

        // User 2 borrows U_1 against isolated U_2
        let reserve_data = pool::get_reserve_data(underlying_u2_token_address);
        let isolation_mode_total_debt_before_borrow =
            pool::get_reserve_isolation_mode_total_debt(reserve_data);
        let isolation_mode_total_debt_after_borrow =
            isolation_mode_total_debt_before_borrow + 1000;

        let first_borrow_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 10);
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            first_borrow_u1_amount,
            2,
            0,
            user2_address
        );

        // check isolation mode total debt emitted events
        let emitted_events = emitted_events<IsolationModeTotalDebtUpdated>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 1, TEST_SUCCESS);

        // check borrow event
        let emitted_events = emitted_events<borrow_logic::Borrow>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 1, TEST_SUCCESS);

        let reserve_data_after = pool::get_reserve_data(underlying_u2_token_address);
        let isolation_mode_total_debt =
            pool::get_reserve_isolation_mode_total_debt(reserve_data_after);
        assert!(
            isolation_mode_total_debt == isolation_mode_total_debt_after_borrow,
            TEST_SUCCESS
        );

        // U_2 exits isolation mode (debt ceiling = 1000)
        let new_debt_ceiling =
            convert_to_currency_decimals(underlying_u1_token_address, 1000);
        pool_configurator::set_debt_ceiling(
            aave_pool,
            underlying_u2_token_address,
            new_debt_ceiling
        );

        let debt_ceiling =
            pool_data_provider::get_debt_ceiling(underlying_u2_token_address);
        assert!(debt_ceiling == new_debt_ceiling, TEST_SUCCESS);

        // User 2 borrows 1 U_1
        let second_borrow_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 1);
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            second_borrow_u1_amount,
            2,
            0,
            user2_address
        );

        // User 2 repays debt
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_u1_amount as u64),
            underlying_u1_token_address
        );

        let repay_u1_amount =
            convert_to_currency_decimals(underlying_u1_token_address, 10);
        borrow_logic::repay(
            user2,
            underlying_u1_token_address,
            repay_u1_amount,
            2,
            user2_address
        );

        let debt_ceiling =
            pool_data_provider::get_debt_ceiling(underlying_u2_token_address);
        assert!(debt_ceiling == new_debt_ceiling, TEST_SUCCESS);

        let reserve_data = pool::get_reserve_data(underlying_u2_token_address);
        let isolation_mode_total_debt =
            pool::get_reserve_isolation_mode_total_debt(reserve_data);

        assert!(isolation_mode_total_debt == 100, TEST_SUCCESS);
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x041,
            user2 = @0x042
        )
    ]
    // User 1 deposits 100 U_1, user 2 deposits 100 U_2, borrows 50 U_1
    // User 2 receives 25 aToken from user 1, repays half of the debt
    fun test_repay_with_a_tokens_with_repay_half_of_the_debt(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));

        // mint 10 APT to the user1_address and user2_address
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user1_address, 1_000_000_000
        );
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user2_address, 1_000_000_000
        );

        // mint 100 U_1 for user 1
        let mint_amount = convert_to_currency_decimals(underlying_u1_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_amount as u64),
            underlying_u1_token_address
        );

        // user 1 supplies 100 U_1
        let supply_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 100
        );
        supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_amount,
            user1_address,
            0
        );

        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));
        // mint 100 U_2 for user 2
        let mint_amount = convert_to_currency_decimals(underlying_u2_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_amount as u64),
            underlying_u2_token_address
        );

        // user 2 supplies 100 U_2
        let supply_amount = convert_to_currency_decimals(
            underlying_u2_token_address, 100
        );
        supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_amount,
            user2_address,
            0
        );

        // set asset price
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            100
        );

        // set global time
        timestamp::fast_forward_seconds(1000);

        // user 2 borrows 50 U_1
        let borrow_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 50
        );
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 1 transfers 25 aToken to user 2
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);

        let transfer_amount = convert_to_currency_decimals(a_token_address, 25);
        pool_token_logic::transfer(
            user1,
            user2_address,
            transfer_amount,
            a_token_address
        );

        let user2_balance_before =
            a_token_factory::balance_of(user2_address, a_token_address);
        let user2_debt_before =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );

        // user 2 repays half of the debt
        let repay_amount = convert_to_currency_decimals(underlying_u1_token_address, 25);
        borrow_logic::repay_with_a_tokens(
            user2,
            underlying_u1_token_address,
            repay_amount,
            2 // variable interest rate mode
        );

        // check emitted events
        let emitted_repay_events = emitted_events<borrow_logic::Repay>();
        assert!(vector::length(&emitted_repay_events) == 1, TEST_SUCCESS);

        // check user 2 balances
        let user2_balance_after =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(
            user2_balance_after == user2_balance_before - repay_amount,
            TEST_SUCCESS
        );

        let user2_debt_after =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(
            user2_debt_after == user2_debt_before - repay_amount,
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x041,
            user2 = @0x042
        )
    ]
    // User 1 deposits 100 U_1, user 2 deposits 100 U_2, borrows 50 U_1
    // User 2 receives 25 aToken from user 1, use all aToken to repay debt
    fun test_repay_with_a_tokens_with_all_atoken_to_repay_debt(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));

        // mint 10 APT to the user1_address and user2_address
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user1_address, 1_000_000_000
        );
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user2_address, 1_000_000_000
        );

        // mint 100 U_1 for user 1
        let mint_amount = convert_to_currency_decimals(underlying_u1_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_amount as u64),
            underlying_u1_token_address
        );

        // user 1 supplies 100 U_1
        let supply_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 100
        );
        supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_amount,
            user1_address,
            0
        );

        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));
        // mint 100 U_2 for user 2
        let mint_amount = convert_to_currency_decimals(underlying_u2_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_amount as u64),
            underlying_u2_token_address
        );

        // user 2 supplies 100 U_2
        let supply_amount = convert_to_currency_decimals(
            underlying_u2_token_address, 100
        );
        supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_amount,
            user2_address,
            0
        );

        // set asset price
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            100
        );

        // set global time
        timestamp::fast_forward_seconds(1000);

        // user 2 borrows 50 U_1
        let borrow_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 50
        );
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 1 transfers 25 aToken to user 2
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);

        let transfer_amount = convert_to_currency_decimals(a_token_address, 25);
        pool_token_logic::transfer(
            user1,
            user2_address,
            transfer_amount,
            a_token_address
        );

        let user2_balance_before =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(user2_balance_before == transfer_amount, TEST_SUCCESS);

        let user2_debt_before =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );

        // user 2 repays half of the debt
        let repay_amount = math_utils::u256_max();
        borrow_logic::repay_with_a_tokens(
            user2,
            underlying_u1_token_address,
            repay_amount,
            2 // variable interest rate mode
        );

        // check emitted events
        let emitted_repay_events = emitted_events<borrow_logic::Repay>();
        assert!(vector::length(&emitted_repay_events) == 1, TEST_SUCCESS);

        // check user 2 balances
        let user2_balance_after =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(user2_balance_after == 0, TEST_SUCCESS);

        let user2_debt_after =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(
            user2_debt_after == user2_debt_before - transfer_amount,
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x041,
            user2 = @0x042
        )
    ]
    // User 1 deposits 100 U_1, user 2 deposits 100 U_2, borrows 50 U_1
    // User 2 receives 50 aToken from user 1, repay all debt
    fun test_repay_with_a_tokens_with_repay_all_debt(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        // mint 100 U_1 for user 1
        let mint_amount = convert_to_currency_decimals(underlying_u1_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_amount as u64),
            underlying_u1_token_address
        );

        // user 1 supplies 100 U_1
        let supply_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 100
        );
        supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_amount,
            user1_address,
            0
        );

        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));

        // mint 10 APT to the user1_address and user2_address
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user1_address, 1_000_000_000
        );
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user2_address, 1_000_000_000
        );

        // mint 100 U_2 for user 2
        let mint_amount = convert_to_currency_decimals(underlying_u2_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_amount as u64),
            underlying_u2_token_address
        );

        // user 2 supplies 100 U_2
        let supply_amount = convert_to_currency_decimals(
            underlying_u2_token_address, 100
        );
        supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_amount,
            user2_address,
            0
        );

        // set asset price
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            100
        );

        // set global time
        timestamp::fast_forward_seconds(1000);

        // user 2 borrows 50 U_1
        let borrow_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 50
        );
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 1 transfers 25 aToken to user 2
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);

        let transfer_amount = convert_to_currency_decimals(a_token_address, 50);
        pool_token_logic::transfer(
            user1,
            user2_address,
            transfer_amount,
            a_token_address
        );

        let user2_balance_before =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(user2_balance_before == transfer_amount, TEST_SUCCESS);

        let user2_debt_before =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );

        // user 2 repays half of the debt
        let repay_amount = math_utils::u256_max();
        borrow_logic::repay_with_a_tokens(
            user2,
            underlying_u1_token_address,
            repay_amount,
            2 // variable interest rate mode
        );

        // check emitted events
        let emitted_repay_events = emitted_events<borrow_logic::Repay>();
        assert!(vector::length(&emitted_repay_events) == 1, TEST_SUCCESS);

        // check user 2 balances
        let user2_balance_after =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(
            user2_balance_after == user2_balance_before - user2_debt_before,
            TEST_SUCCESS
        );

        let user2_debt_after =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(user2_debt_after == 0, TEST_SUCCESS);

        // Check interest rates after repaying with aTokens
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let reserve_config_map =
            pool::get_reserve_configuration_by_reserve_data(reserve_data);
        let current_liquidity_rate =
            pool::get_reserve_current_liquidity_rate(reserve_data);
        let current_variable_borrow_rate =
            pool::get_reserve_current_variable_borrow_rate(reserve_data);

        let unbacked = 0;
        let liquidity_added = 0;
        let liquidity_taken = 0;
        let total_variable_debt =
            variable_debt_token_factory::total_supply(variable_debt_token_address);
        let reserve_factor = reserve_config::get_reserve_factor(&reserve_config_map);
        let reserve = underlying_u1_token_address;
        // The underlying token balance corresponding to the aToken
        let a_token_underlying_balance =
            (
                fungible_asset_manager::balance_of(
                    a_token_factory::get_token_account_address(a_token_address),
                    underlying_u1_token_address
                ) as u256
            );

        let (cacl_current_liquidity_rate, cacl_current_variable_borrow_rate) =
            default_reserve_interest_rate_strategy::calculate_interest_rates(
                unbacked,
                liquidity_added,
                liquidity_taken,
                total_variable_debt,
                reserve_factor,
                reserve,
                a_token_underlying_balance
            );

        assert!(
            (current_liquidity_rate as u256) == cacl_current_liquidity_rate, TEST_SUCCESS
        );
        assert!(
            (current_variable_borrow_rate as u256) == cacl_current_variable_borrow_rate,
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_pool = @aave_pool,
            aave_role_super_admin = @aave_acl,
            aptos_std = @aptos_std,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform,
            underlying_tokens_admin = @aave_mock_underlyings,
            user1 = @0x041,
            user2 = @0x042
        )
    ]
    // User 1 deposits 100 U_1, user 2 deposits 100 U_2, borrows 50 U_1
    // User 2 receives 60 aToken from user 1, user2 collateral state is false
    fun test_repay_with_a_tokens_with_user_collateral_state_is_false(
        aave_pool: &signer,
        aave_role_super_admin: &signer,
        aptos_std: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer,
        underlying_tokens_admin: &signer,
        user1: &signer,
        user2: &signer
    ) {
        init_reserves_with_oracle(
            aave_pool,
            aave_role_super_admin,
            aptos_std,
            aave_oracle,
            data_feeds,
            platform,
            underlying_tokens_admin,
            aave_pool
        );

        let user1_address = signer::address_of(user1);
        let user2_address = signer::address_of(user2);

        let underlying_u1_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));
        // mint 100 U_1 for user 1
        let mint_amount = convert_to_currency_decimals(underlying_u1_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user1_address,
            (mint_amount as u64),
            underlying_u1_token_address
        );

        // user 1 supplies 100 U_1
        let supply_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 100
        );
        supply_logic::supply(
            user1,
            underlying_u1_token_address,
            supply_amount,
            user1_address,
            0
        );

        let underlying_u2_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_2"));

        // mint 10 APT to the user1_address and user2_address
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user1_address, 1_000_000_000
        );
        aptos_framework::aptos_coin_tests::mint_apt_fa_to_primary_fungible_store_for_test(
            user2_address, 1_000_000_000
        );

        // mint 100 U_2 for user 2
        let mint_amount = convert_to_currency_decimals(underlying_u2_token_address, 100);
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            user2_address,
            (mint_amount as u64),
            underlying_u2_token_address
        );

        // user 2 supplies 100 U_2
        let supply_amount = convert_to_currency_decimals(
            underlying_u2_token_address, 100
        );
        supply_logic::supply(
            user2,
            underlying_u2_token_address,
            supply_amount,
            user2_address,
            0
        );

        // set asset price
        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u1_token_address,
            100
        );

        token_helper::set_asset_price(
            aave_role_super_admin,
            aave_oracle,
            underlying_u2_token_address,
            100
        );

        // set global time
        timestamp::fast_forward_seconds(1000);

        // user 2 borrows 50 U_1
        let borrow_amount = convert_to_currency_decimals(
            underlying_u1_token_address, 50
        );
        borrow_logic::borrow(
            user2,
            underlying_u1_token_address,
            borrow_amount,
            2, // variable interest rate mode
            0, // referral
            user2_address
        );

        // user 1 transfers 25 aToken to user 2
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        let variable_debt_token_address =
            pool::get_reserve_variable_debt_token_address(reserve_data);

        let transfer_amount = convert_to_currency_decimals(a_token_address, 60);
        pool_token_logic::transfer(
            user1,
            user2_address,
            transfer_amount,
            a_token_address
        );

        let user2_balance_before =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(user2_balance_before == transfer_amount, TEST_SUCCESS);

        let user2_debt_before =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );

        // set user2 collateral state to false
        supply_logic::set_user_use_reserve_as_collateral(
            user2, underlying_u1_token_address, false
        );

        // user 2 repays half of the debt
        let repay_amount = math_utils::u256_max();
        borrow_logic::repay_with_a_tokens(
            user2,
            underlying_u1_token_address,
            repay_amount,
            2 // variable interest rate mode
        );

        // check emitted events
        let emitted_repay_events = emitted_events<borrow_logic::Repay>();
        assert!(vector::length(&emitted_repay_events) == 1, TEST_SUCCESS);

        // check user 2 balances
        let user2_balance_after =
            a_token_factory::balance_of(user2_address, a_token_address);
        assert!(
            user2_balance_after == user2_balance_before - user2_debt_before,
            TEST_SUCCESS
        );

        let user2_debt_after =
            variable_debt_token_factory::balance_of(
                user2_address, variable_debt_token_address
            );
        assert!(user2_debt_after == 0, TEST_SUCCESS);

        // Check interest rates after repaying with aTokens
        let reserve_data = pool::get_reserve_data(underlying_u1_token_address);
        let reserve_config_map =
            pool::get_reserve_configuration_by_reserve_data(reserve_data);
        let current_liquidity_rate =
            pool::get_reserve_current_liquidity_rate(reserve_data);
        let current_variable_borrow_rate =
            pool::get_reserve_current_variable_borrow_rate(reserve_data);

        let unbacked = 0;
        let liquidity_added = 0;
        let liquidity_taken = 0;
        let total_variable_debt =
            variable_debt_token_factory::total_supply(variable_debt_token_address);
        let reserve_factor = reserve_config::get_reserve_factor(&reserve_config_map);
        let reserve = underlying_u1_token_address;
        // The underlying token balance corresponding to the aToken
        let a_token_underlying_balance =
            (
                fungible_asset_manager::balance_of(
                    a_token_factory::get_token_account_address(a_token_address),
                    underlying_u1_token_address
                ) as u256
            );

        let (cacl_current_liquidity_rate, cacl_current_variable_borrow_rate) =
            default_reserve_interest_rate_strategy::calculate_interest_rates(
                unbacked,
                liquidity_added,
                liquidity_taken,
                total_variable_debt,
                reserve_factor,
                reserve,
                a_token_underlying_balance
            );

        assert!(
            (current_liquidity_rate as u256) == cacl_current_liquidity_rate, TEST_SUCCESS
        );
        assert!(
            (current_variable_borrow_rate as u256) == cacl_current_variable_borrow_rate,
            TEST_SUCCESS
        );
    }
}
