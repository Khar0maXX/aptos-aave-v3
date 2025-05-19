#[test_only]
module aave_mock_underlyings::mock_underlying_token_factory_tests {
    use std::features::change_feature_flags_for_testing;
    use std::option::Self;
    use std::signer::Self;
    use std::string::utf8;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object::Self;
    use aave_mock_underlyings::mock_underlying_token_factory::Self;

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    #[test(aave_mock_underlyings = @aave_mock_underlyings, aave_std = @std)]
    fun test_underlying_token_initialization(
        aave_mock_underlyings: &signer, aave_std: &signer
    ) {
        // add the test events feature flag
        change_feature_flags_for_testing(aave_std, vector[26], vector[]);

        // init underlying tokens
        mock_underlying_token_factory::test_init_module(aave_mock_underlyings);

        // create underlying tokens
        let name = utf8(b"TOKEN_1");
        let symbol = utf8(b"T1");
        let decimals = 6;
        let max_supply = 10000;
        mock_underlying_token_factory::create_token(
            aave_mock_underlyings,
            max_supply,
            name,
            symbol,
            decimals,
            utf8(b""),
            utf8(b"")
        );
        let underlying_token_metadata =
            mock_underlying_token_factory::get_metadata_by_symbol(symbol);
        let underlying_token_address =
            mock_underlying_token_factory::token_address(symbol);
        assert!(
            object::address_to_object<Metadata>(underlying_token_address)
                == underlying_token_metadata,
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::get_token_account_address()
                == signer::address_of(aave_mock_underlyings),
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::supply(underlying_token_address)
                == option::some(0),
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::decimals(underlying_token_address)
                == decimals,
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::maximum(underlying_token_address)
                == option::some(max_supply),
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::symbol(underlying_token_address) == symbol,
            TEST_SUCCESS
        );
        assert!(
            mock_underlying_token_factory::name(underlying_token_address) == name,
            TEST_SUCCESS
        );
    }

    #[test(aave_mock_underlyings = @aave_mock_underlyings, aave_std = @std)]
    fun test_underlying_token_minting_burn(
        aave_mock_underlyings: &signer, aave_std: &signer
    ) {
        // add the test events feature flag
        change_feature_flags_for_testing(aave_std, vector[26], vector[]);

        // init underlying tokens
        mock_underlying_token_factory::test_init_module(aave_mock_underlyings);

        // create underlying tokens
        let name = utf8(b"TOKEN_1");
        let symbol = utf8(b"T1");
        let decimals = 6;
        let max_supply = 10000;
        mock_underlying_token_factory::create_token(
            aave_mock_underlyings,
            max_supply,
            name,
            symbol,
            decimals,
            utf8(b""),
            utf8(b"")
        );
        let underlying_token_address =
            mock_underlying_token_factory::token_address(symbol);
        let receiver_address = @0x42;

        // mint 100 tokens
        mock_underlying_token_factory::mint(
            aave_mock_underlyings,
            receiver_address,
            100,
            underlying_token_address
        );
        let user_balance =
            mock_underlying_token_factory::balance_of(
                receiver_address, underlying_token_address
            );
        assert!(user_balance == 100, TEST_SUCCESS);
        assert!(
            mock_underlying_token_factory::supply(underlying_token_address)
                == option::some(100),
            TEST_SUCCESS
        );

        // burn half of the tokens
        mock_underlying_token_factory::burn(
            receiver_address, 50, underlying_token_address
        );
        let user_balance =
            mock_underlying_token_factory::balance_of(
                receiver_address, underlying_token_address
            );
        assert!(user_balance == 50, TEST_SUCCESS);
        assert!(
            mock_underlying_token_factory::supply(underlying_token_address)
                == option::some(50),
            TEST_SUCCESS
        );
    }
}
