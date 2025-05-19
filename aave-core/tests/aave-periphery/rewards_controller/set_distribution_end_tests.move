#[test_only]
module aave_pool::set_distribution_end_tests {
    use std::vector;
    use aptos_std::simple_map;
    use aptos_framework::event::emitted_events;
    use aave_pool::rewards_controller::{
        get_distribution_end,
        rewards_controller_address,
        add_asset,
        create_asset_data,
        initialize,
        set_distribution_end,
        AssetConfigUpdated
    };
    use aave_pool::rewards_controller_tests::test_setup_with_one_asset;

    const REWARDS_CONTROLLER_NAME: vector<u8> = b"REWARDS_CONTROLLER_FOR_TESTING";

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    #[test(periphery_account = @aave_pool, asset = @0x111, reward = @0x222)]
    #[expected_failure(abort_code = 3022, location = aave_pool::rewards_controller)]
    fun test_set_distribution_end_when_rewards_controller_address_not_exist(
        periphery_account: &signer, asset: address, reward: address
    ) {
        initialize(periphery_account, REWARDS_CONTROLLER_NAME);

        let rewards_controller_address = @0x33;
        let new_distribution_end = 20;

        // rewards_controller_address not exist
        set_distribution_end(
            asset,
            reward,
            new_distribution_end,
            rewards_controller_address
        );
    }

    #[test(periphery_account = @aave_pool, asset = @0x111, reward = @0x222)]
    #[expected_failure(abort_code = 3006, location = aave_pool::rewards_controller)]
    fun test_set_distribution_end_when_asset_not_exist(
        periphery_account: &signer, asset: address, reward: address
    ) {
        initialize(periphery_account, REWARDS_CONTROLLER_NAME);

        let rewards_controller_address =
            rewards_controller_address(REWARDS_CONTROLLER_NAME);
        let new_distribution_end = 20;

        // asset not exist
        set_distribution_end(
            asset,
            reward,
            new_distribution_end,
            rewards_controller_address
        );
    }

    #[test(periphery_account = @aave_pool, asset = @0x111, reward = @0x222)]
    #[expected_failure(abort_code = 3006, location = aave_pool::rewards_controller)]
    fun test_set_distribution_end_when_reward_not_exist(
        periphery_account: &signer, asset: address, reward: address
    ) {
        initialize(periphery_account, REWARDS_CONTROLLER_NAME);

        let rewards_controller_address =
            rewards_controller_address(REWARDS_CONTROLLER_NAME);
        let new_distribution_end = 20;
        // add asset
        add_asset(
            rewards_controller_address,
            asset,
            create_asset_data(simple_map::new(), simple_map::new(), 0, 8)
        );

        // reward not exist
        set_distribution_end(
            asset,
            reward,
            new_distribution_end,
            rewards_controller_address
        );
    }

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
    fun test_get_distribution_end(
        aptos_framework: &signer,
        aave_role_super_admin: &signer,
        pool_admin: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        user: address,
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
                user,
                aave_oracle,
                data_feeds,
                platform
            );

        let new_distribution_end = 10;
        set_distribution_end(
            asset,
            reward,
            new_distribution_end,
            controller_address
        );

        // check AssetConfigUpdated emitted events
        let emitted_events = emitted_events<AssetConfigUpdated>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 2, TEST_SUCCESS);

        assert!(
            get_distribution_end(asset, reward, controller_address)
                == (new_distribution_end as u256),
            TEST_SUCCESS
        );
    }
}
