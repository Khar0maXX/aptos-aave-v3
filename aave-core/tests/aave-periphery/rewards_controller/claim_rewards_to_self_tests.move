#[test_only]
module aave_pool::claim_rewards_to_self_tests {

    use std::signer;
    use aave_pool::rewards_distributor::claim_rewards_to_self;
    use aave_pool::rewards_controller_tests::test_setup_with_one_asset;

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    #[
        test(
            aptos_framework = @aptos_framework,
            aave_role_super_admin = @aave_acl,
            pool_admin = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            user = @0x222,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform
        )
    ]
    fun test_claim_rewards_to_self(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        user: &signer,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer
    ) {
        let (asset, reward, controller_address) =
            test_setup_with_one_asset(
                aptos_framework,
                aave_role_super_admin,
                pool_admin,
                underlying_tokens_admin,
                periphery_account,
                signer::address_of(user),
                aave_oracle,
                data_feeds,
                platform
            );

        claim_rewards_to_self(
            user,
            vector[asset],
            0,
            reward,
            controller_address
        );
    }
}
