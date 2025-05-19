#[test_only]
module aave_pool::claim_all_rewards_on_behalf_tests {
    use std::signer;
    use aave_pool::rewards_controller::set_claimer;
    use aave_pool::rewards_distributor::claim_all_rewards_on_behalf;
    use aave_pool::rewards_controller_tests::test_setup_with_one_asset;

    #[
        test(
            aptos_framework = @aptos_framework,
            aave_role_super_admin = @aave_acl,
            pool_admin = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            claimer = @0x111,
            user = @0x222,
            recipient = @0x333,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform
        )
    ]
    fun test_claim_all_rewards_on_behalf(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        claimer: &signer,
        user: address,
        recipient: address,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer
    ) {
        let (asset, _reward, controller_address) =
            test_setup_with_one_asset(
                aptos_framework,
                aave_role_super_admin,
                pool_admin,
                underlying_tokens_admin,
                periphery_account,
                user,
                aave_oracle,
                data_feeds,
                platform
            );

        set_claimer(user, signer::address_of(claimer), controller_address);
        claim_all_rewards_on_behalf(
            claimer,
            vector[asset],
            user,
            recipient,
            controller_address
        );
    }

    #[
        test(
            aptos_framework = @aptos_framework,
            aave_role_super_admin = @aave_acl,
            pool_admin = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            claimer = @0x111,
            user = @0x0,
            recipient = @0x333,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform
        )
    ]
    #[expected_failure(abort_code = 77, location = aave_pool::rewards_distributor)]
    fun test_claim_all_rewards_on_behalf_when_user_is_zero_address_not_valid(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        claimer: &signer,
        user: address,
        recipient: address,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer
    ) {
        let (asset, _reward, controller_address) =
            test_setup_with_one_asset(
                aptos_framework,
                aave_role_super_admin,
                pool_admin,
                underlying_tokens_admin,
                periphery_account,
                user,
                aave_oracle,
                data_feeds,
                platform
            );

        set_claimer(user, signer::address_of(claimer), controller_address);
        claim_all_rewards_on_behalf(
            claimer,
            vector[asset],
            user,
            recipient,
            controller_address
        );
    }

    #[
        test(
            aptos_framework = @aptos_framework,
            aave_role_super_admin = @aave_acl,
            pool_admin = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            claimer = @0x111,
            user = @0x222,
            recipient = @0x0,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform
        )
    ]
    #[expected_failure(abort_code = 77, location = aave_pool::rewards_distributor)]
    fun test_claim_all_rewards_on_behalf_when_recipient_is_zero_address_not_valid(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        claimer: &signer,
        user: address,
        recipient: address,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer
    ) {
        let (asset, _reward, controller_address) =
            test_setup_with_one_asset(
                aptos_framework,
                aave_role_super_admin,
                pool_admin,
                underlying_tokens_admin,
                periphery_account,
                user,
                aave_oracle,
                data_feeds,
                platform
            );

        set_claimer(user, signer::address_of(claimer), controller_address);
        claim_all_rewards_on_behalf(
            claimer,
            vector[asset],
            user,
            recipient,
            controller_address
        );
    }

    #[
        test(
            aptos_framework = @aptos_framework,
            aave_role_super_admin = @aave_acl,
            pool_admin = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            claimer = @0x111,
            user = @0x222,
            recipient = @0x333,
            aave_oracle = @aave_oracle,
            data_feeds = @data_feeds,
            platform = @platform
        )
    ]
    #[expected_failure(abort_code = 3003, location = aave_pool::rewards_distributor)]
    fun test_claim_all_rewards_on_behalf_when_claimer_is_unauthorized_claimer(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        claimer: &signer,
        user: address,
        recipient: address,
        aave_oracle: &signer,
        data_feeds: &signer,
        platform: &signer
    ) {
        let (asset, _reward, controller_address) =
            test_setup_with_one_asset(
                aptos_framework,
                aave_role_super_admin,
                pool_admin,
                underlying_tokens_admin,
                periphery_account,
                user,
                aave_oracle,
                data_feeds,
                platform
            );

        set_claimer(user, signer::address_of(claimer), controller_address);
        claim_all_rewards_on_behalf(
            pool_admin,
            vector[asset],
            user,
            recipient,
            controller_address
        );
    }
}
