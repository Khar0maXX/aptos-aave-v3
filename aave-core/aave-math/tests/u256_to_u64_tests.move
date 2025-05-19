#[test_only]
module aave_math::u256_to_u64_tests {
    use aave_math::math_utils::pow;
    use aave_math::wad_ray_math::ray_div;

    /// u64 max
    const U64_MAX: u64 = 18446744073709551615;
    /// u256 max
    const U256_MAX: u256 =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    /// 10^18
    const WAD: u256 = 1_000_000_000_000_000_000;
    /// 5 * 10^17
    const HALF_WAD: u256 = 500_000_000_000_000_000;
    /// 10^27
    const RAY: u256 = 1_000_000_000_000_000_000_000_000_000;
    /// 5 * 10^26
    const HALF_RAY: u256 = 500_000_000_000_000_000_000_000_000;
    /// 10^9
    const WAD_RAY_RATIO: u256 = 1_000_000_000;

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    /// error code
    /// Calculation results in overflow
    const EOVERFLOW: u64 = 1101;
    /// Cannot divide by zero
    const EDIVISION_BY_ZERO: u64 = 1102;

    #[test]
    #[expected_failure(arithmetic_error, location = Self)]
    fun test_max_u256_to_u64() {
        assert!((U256_MAX as u64) > 0, EOVERFLOW);
    }

    #[test]
    // When both a and b are greater than 0, Minimum value is 1
    fun test_ray_div_minimum() {
        let a = 1;
        let b = RAY;
        let res = ray_div(a, b);
        assert!(res == 1, TEST_SUCCESS)
    }

    #[test]
    // 1000000 <= a <= U64_MAX, 1 < b < U256_MAX
    // a = U64_MAX, b = RAY-1, res = a
    fun test_ray_div_u64_maximum() {
        let a = (U64_MAX as u256);
        let b = RAY - 1;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), TEST_SUCCESS);
    }

    #[test]
    // 1000000 <= a <= U64_MAX
    // When both a and b are greater than 0, b < U64_MAX and a Maximum value is 115792089237316195423570985008687907853269984665640
    // res = 8728839285102840232114099377157550808226231863799716645
    #[expected_failure(abort_code = 1101, location = Self)]
    fun test_ray_div_u64_aequal_maximum_overflow() {
        let b = 13265462389132757665657;
        let a = (U256_MAX - b / 2) / RAY;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW)
    }

    // b = RAY; scaled_amount = a < u64::MAX
    // b > RAY; scaled_amount < u64::MAX
    // b < RAY; scaled_amount < u64::MAX or scaled_amount > u64::MAX

    // 1000000 <= a <= U64_MAX, 1 < b < RAY
    // a = U64_MAX, b = RAY - 1999999999999999
    #[test]
    #[expected_failure(abort_code = 1101, location = Self)]
    fun test_ray_div_u64_a_equal_maxu64_overflow() {
        let a = (U64_MAX as u256);
        let b = RAY - 1999999999999999;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);
    }

    #[test]
    // 1000000 <= a <= U64_MAX
    // a = U64_MAX, b = RAY; res = a < u64::MAX
    fun test_ray_div_u64_b_equal_ray() {
        // b = RAY; the maximum value of a is u64::MAX, the maximum value of the scaling result is: u64::MAX
        let a = (U64_MAX as u256);
        let b = RAY;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);
    }

    #[test]
    // RAY < b < u256::MAX; res < u64::MAX
    fun test_ray_div_u64_b_greater_than_ray() {
        // RAY < b < u256::MAX; b = RAY+1;  the minimum value of a is u64::MAX, the maximum value of the scaling result is: u64::MAX
        let a = (U64_MAX as u256);
        let b = RAY + 1;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);

        // a = 1000000; b = RAY+1; res = 1000000
        let a = 1000000;
        let b = RAY + 1;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);

        // RAY < b < u256::MAX; b = U256_MAX;  the minimum value of a is 1000000, the maximum value of the scaling result is: u64::MAX
        // a = 1000000, b = U256_MAX, res = 0
        let b = U256_MAX;
        let a = 1000000;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);

        // RAY < b < u256::MAX; b = U256_MAX;  the maximum value of a is u64:MAX, the maximum value of the scaling result is: u64::MAX
        // let a = U64_MAX; b = U256_MAX; res = 0;
        let a = (U64_MAX as u256);
        let b = U256_MAX;
        let res = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);

        // RAY < b < u256::MAX; b = RAY * RAY;  the maximum value of a is u64:MAX, the maximum value of the scaling result is: u64::MAX
        // let a = U64_MAX; b = U256_MAX; res = 0;
        let a = U64_MAX;
        let b = RAY * RAY;
        let res = ray_div((a as u256), b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);
    }

    #[test]
    // 1 < b < RAY; res < u64::MAX
    fun test_ray_div_u64_b_less_than_ray() {
        // 1 < b < RAY; a = 1000000, b = 542101086242692 the minimum value of a is 1000000, the maximum value of the scaling result is: u64::MAX
        let u64_max = (U64_MAX as u256);
        // a = 1000000, b =542101086242692, res = 1844674407371160069
        let a = 1000000;
        let b = 542101086242692;
        let res = ray_div(a, b);
        assert!(res <= u64_max, TEST_SUCCESS);

        // 1 < b < RAY; a = 1000000, b=RAY-1,  the minimum value of a is 1000000, the maximum value of the scaling result is: u64::MAX
        // a = 1000000, b =RAY - 1, res = 1000000
        let a = 1000000;
        let b = RAY - 1; // min index
        let res = ray_div(a, b);
        assert!(res <= u64_max, TEST_SUCCESS);

        // 1 < b < RAY; a = u64_max,  b=RAY-1,  the minimum value of a is U64_MAX, the maximum value of the scaling result is: u64::MAX
        // 1 < b < RAY ;  1000000<a<U64_MAX
        // (a * RAY / (b = 1, b =RAY-1) ) = max
        // a = u64_max, b =RAY - 1, res = 1844674407371160069
        let a = u64_max;
        let b = RAY - 1;
        let res = ray_div(a, b);
        assert!(res <= u64_max, TEST_SUCCESS);

        // 1 < b < RAY; a = 1000000,  b=2*10**24, the minimum value of a is 1000000, the maximum value of the scaling result is: u64::MAX
        // a = 1000000, b = 2*10**24 , res = 1;
        let a: u256 = 1000000;
        let b: u256 = 2 * pow(10, 24);
        let res: u256 = ray_div(a, b);
        assert!(res <= u64_max, TEST_SUCCESS);

        // 1 < b < RAY;  b = RAY - 1999998877, the minimum value of a is 134534543232342353231234, the maximum value of the scaling result is: u64::MAX
        let a: u256 = 13453454323;
        let b: u256 = RAY - 1999998877;
        let res: u256 = ray_div(a, b);
        assert!(res <= u64_max, TEST_SUCCESS);
    }

    #[test]
    // 1 < b < RAY; res < u64::MAX
    #[expected_failure(abort_code = 1101, location = Self)]
    fun test_ray_div_u64_b_less_than_ray_overflow() {
        // 1 < b < RAY; a = 1000000, b=10000000, the minimum value of a is 1000000, the maximum value of the scaling result is: 100000000000000000000000000
        // a = 1000000, b = 10000000 , res = 100000000000000000000000000 > U64_MAX ;
        let a: u256 = 1000000;
        let b: u256 = 10000000;
        let res: u256 = ray_div(a, b);
        assert!(res <= (U64_MAX as u256), EOVERFLOW);
    }

    #[test]
    #[expected_failure(abort_code = 1102, location = aave_math::wad_ray_math)]
    fun test_ray_div_by_zero() {
        let a = 134534543232342353231234;
        let b = 0;
        ray_div(a, b);
    }
}
