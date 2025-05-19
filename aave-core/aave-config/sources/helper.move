/// @title Helper
/// @author Aave
/// @notice Provides utility functions for various operations
module aave_config::helper {
    // Global Constants
    /// @notice Constant representing a u256 value with all bits set to 1
    const ALL_ONES: u256 =
        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    // Public functions
    /// @notice Get the result of bitwise negation for a u256 value
    /// @param m The u256 value to negate
    /// @return The bitwise negation result as u256
    public fun bitwise_negation(m: u256): u256 {
        m ^ ALL_ONES
    }

    // Test-only functions
    #[test]
    /// @dev Test for the bitwise_negation function
    fun test_bitwise_negation() {
        let ret =
            bitwise_negation(
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000
            );
        assert!(ret == 65535, 1);
    }
}
