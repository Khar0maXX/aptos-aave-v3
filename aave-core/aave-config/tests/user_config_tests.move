#[test_only]
module aave_config::user_tests {
    use aave_config::reserve_config;
    use aave_config::helper::Self;
    use aave_config::user_config::{
        get_first_asset_id_by_mask,
        init,
        is_borrowing,
        is_borrowing_any,
        is_borrowing_one,
        is_empty,
        is_using_as_collateral,
        is_using_as_collateral_any,
        is_using_as_collateral_one,
        is_using_as_collateral_or_borrowing,
        set_borrowing,
        set_using_as_collateral,
        get_interest_rate_mode_none,
        get_interest_rate_mode_variable,
        get_borrowing_mask,
        get_collateral_mask,
        get_minimum_health_factor_liquidation_threshold,
        get_health_factor_liquidation_threshold
    };

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    const BORROWING_MASK: u256 =
        0x5555555555555555555555555555555555555555555555555555555555555555;
    const COLLATERAL_MASK: u256 =
        0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA;
    const MINIMUM_HEALTH_FACTOR_LIQUIDATION_THRESHOLD: u256 = 950000000000000000;
    const HEALTH_FACTOR_LIQUIDATION_THRESHOLD: u256 = 1000000000000000000;
    const INTEREST_RATE_MODE_NONE: u8 = 0;
    /// 1 = Stable Rate, 2 = Variable Rate, Since the Stable Rate service has been removed, only the Variable Rate service is retained.
    const INTEREST_RATE_MODE_VARIABLE: u8 = 2;

    #[test]
    fun test_get_interest_rate_mode_none() {
        assert!(get_interest_rate_mode_none() == INTEREST_RATE_MODE_NONE, TEST_SUCCESS);
    }

    #[test]
    fun test_get_interest_rate_mode_variable() {
        assert!(
            get_interest_rate_mode_variable() == INTEREST_RATE_MODE_VARIABLE,
            TEST_SUCCESS
        );
    }

    #[test]
    fun test_get_borrowing_mask() {
        assert!(get_borrowing_mask() == BORROWING_MASK, TEST_SUCCESS);
    }

    #[test]
    fun test_get_collateral_mask() {
        assert!(get_collateral_mask() == COLLATERAL_MASK, TEST_SUCCESS);
    }

    #[test]
    fun test_get_minimum_health_factor_liquidation_threshold() {
        assert!(
            get_minimum_health_factor_liquidation_threshold()
                == MINIMUM_HEALTH_FACTOR_LIQUIDATION_THRESHOLD,
            TEST_SUCCESS
        );
    }

    #[test]
    fun test_get_health_factor_liquidation_threshold() {
        assert!(
            get_health_factor_liquidation_threshold()
                == HEALTH_FACTOR_LIQUIDATION_THRESHOLD,
            TEST_SUCCESS
        );
    }

    #[test]
    fun test_user_config() {
        // test default values
        let user_config_map = init();
        assert!(is_empty(&user_config_map), TEST_SUCCESS);
        assert!(!is_borrowing_any(&user_config_map), TEST_SUCCESS);
        assert!(!is_using_as_collateral_any(&user_config_map), TEST_SUCCESS);
        let user_config_map = init();
        // test borrowing
        let reserve_index: u256 = 1;
        set_borrowing(&mut user_config_map, reserve_index, true);
        assert!(is_borrowing(&mut user_config_map, reserve_index), TEST_SUCCESS);
        assert!(is_borrowing_any(&mut user_config_map), TEST_SUCCESS);
        assert!(is_borrowing_one(&mut user_config_map), TEST_SUCCESS);
        assert!(
            is_using_as_collateral_or_borrowing(&mut user_config_map, reserve_index),
            TEST_SUCCESS
        );
        // test collateral
        set_using_as_collateral(&mut user_config_map, reserve_index, true);
        assert!(is_using_as_collateral(&user_config_map, reserve_index), TEST_SUCCESS);
        assert!(is_using_as_collateral_any(&user_config_map), TEST_SUCCESS);
        assert!(is_using_as_collateral_one(&user_config_map), TEST_SUCCESS);
        assert!(
            is_using_as_collateral_or_borrowing(&user_config_map, reserve_index),
            TEST_SUCCESS
        );

        // set borrowing false
        set_borrowing(&mut user_config_map, reserve_index, false);
        assert!(!is_borrowing(&user_config_map, reserve_index), TEST_SUCCESS);
        assert!(!is_borrowing_any(&user_config_map), TEST_SUCCESS);
        assert!(!is_borrowing_one(&user_config_map), TEST_SUCCESS);
        assert!(
            is_using_as_collateral_or_borrowing(&mut user_config_map, reserve_index),
            TEST_SUCCESS
        );

        // set using as collateral false
        set_using_as_collateral(&mut user_config_map, reserve_index, false);
        assert!(!is_using_as_collateral(&user_config_map, reserve_index), TEST_SUCCESS);
        assert!(!is_using_as_collateral_any(&user_config_map), TEST_SUCCESS);
        assert!(!is_using_as_collateral_one(&user_config_map), TEST_SUCCESS);
        assert!(
            !is_using_as_collateral_or_borrowing(&user_config_map, reserve_index),
            TEST_SUCCESS
        );
    }

    #[test]
    fun test_get_first_asset_id_by_mask() {
        let user_config_map = init();
        let reserve_index: u256 = 1;
        set_using_as_collateral(&mut user_config_map, reserve_index, true);
        let mask = 1 << (((reserve_index << 1) + 1) as u8);
        assert!(get_first_asset_id_by_mask(&user_config_map, mask) == 1, TEST_SUCCESS);
    }

    #[test]
    fun test_bit_shifts() {
        let reserve_index: u256 = 127;
        let bit: u256 = 1 << ((reserve_index << 1) as u8);
        let data: u256 = 100000;
        data = data & helper::bitwise_negation(bit);
        assert!(data == 100000, 1);
    }

    #[test]
    #[expected_failure(arithmetic_error, location = Self)]
    fun test_bit_shifts_arithmetic_error() {
        let reserve_index: u256 = 128;
        let bit: u256 = 1 << ((reserve_index << 1) as u8);
        let data: u256 = 100000;
        data = data & helper::bitwise_negation(bit);
        assert!(data == 100000, TEST_FAILED);
    }

    #[test]
    #[expected_failure(abort_code = 74, location = aave_config::user_config)]
    fun test_set_borrowing_when_reserve_index_is_greater_than_max_reserves_count() {
        let user_config_map = init();
        let reserve_index = reserve_config::get_max_reserves_count() + 1;
        set_borrowing(&mut user_config_map, reserve_index, true);
    }

    #[test]
    #[expected_failure(abort_code = 74, location = aave_config::user_config)]
    fun test_set_using_as_collateral_when_reserve_index_is_greater_than_max_reserves_count() {
        let user_config_map = init();
        let reserve_index = reserve_config::get_max_reserves_count() + 1;
        set_using_as_collateral(&mut user_config_map, reserve_index, true)
    }

    #[test]
    #[expected_failure(abort_code = 74, location = aave_config::user_config)]
    fun test_is_using_as_collateral_or_borrowing_when_reserve_index_is_greater_than_max_reserves_count() {
        let user_config_map = init();
        let reserve_index = reserve_config::get_max_reserves_count() + 1;
        let is_collateral_or_borrowing =
            is_using_as_collateral_or_borrowing(&user_config_map, reserve_index);
        assert!(is_collateral_or_borrowing == false, TEST_SUCCESS)
    }

    #[test]
    #[expected_failure(abort_code = 74, location = aave_config::user_config)]
    fun test_is_borrowing_when_reserve_index_is_greater_than_max_reserves_count() {
        let user_config_map = init();
        let reserve_index = reserve_config::get_max_reserves_count() + 1;
        let is_borrowing = is_borrowing(&user_config_map, reserve_index);
        assert!(is_borrowing == false, TEST_SUCCESS)
    }

    #[test]
    #[expected_failure(abort_code = 74, location = aave_config::user_config)]
    fun test_is_using_as_collateral_when_reserve_index_is_greater_than_max_reserves_count() {
        let user_config_map = init();
        let reserve_index = reserve_config::get_max_reserves_count() + 1;
        let is_using_as_collateral =
            is_using_as_collateral(&user_config_map, reserve_index);
        assert!(is_using_as_collateral == false, TEST_SUCCESS)
    }
}
