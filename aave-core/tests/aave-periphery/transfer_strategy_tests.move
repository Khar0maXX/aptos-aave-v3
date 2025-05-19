#[test_only]
module aave_pool::transfer_strategy_tests {
    use std::signer;
    use std::string;
    use std::string::utf8;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::emitted_events;
    use aptos_framework::object::{Self, Object};
    use aave_acl::acl_manage;
    use aave_math::wad_ray_math;

    use aave_pool::variable_debt_token_factory;
    use aave_pool::a_token_factory;
    use aave_pool::token_base;
    use aave_mock_underlyings::mock_underlying_token_factory;
    use aave_pool::pool;
    use aave_pool::token_helper;
    use aave_pool::transfer_strategy::{
        test_create_pull_rewards_transfer_strategy,
        pull_rewards_transfer_strategy_get_incentives_controller,
        pull_rewards_transfer_strategy_get_rewards_admin,
        pull_rewards_transfer_strategy_get_rewards_vault,
        pull_rewards_transfer_strategy_emergency_withdrawal,
        pull_rewards_transfer_strategy_perform_transfer,
        PullRewardsTransferStrategy,
        EmergencyWithdrawal
    };

    const TEST_SUCCESS: u64 = 1;
    const TEST_FAILED: u64 = 2;

    fun create_sample_pull_rewards_transfer_strategy(
        periphery_account: &signer, incentives_controller: address
    ): Object<PullRewardsTransferStrategy> {
        let periphery_address = signer::address_of(periphery_account);

        let (_, rewards_vault) = account::create_resource_account(
            periphery_account, b""
        );

        let constructor_ref = object::create_sticky_object(periphery_address);
        test_create_pull_rewards_transfer_strategy(
            periphery_account,
            &constructor_ref,
            periphery_address,
            incentives_controller,
            rewards_vault
        )
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            periphery_account = @aave_pool,
            incentives_controller = @0x111
        )
    ]
    fun test_pull_rewards_transfer_strategy_get_rewards_vault(
        aave_role_super_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );
        assert!(
            pull_rewards_transfer_strategy_get_rewards_vault(strategy)
                == account::create_resource_address(
                    &signer::address_of(periphery_account), b""
                ),
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            periphery_account = @aave_pool,
            incentives_controller = @0x111
        )
    ]
    fun test_pull_rewards_transfer_strategy_get_incentives_controller(
        aave_role_super_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );
        assert!(
            pull_rewards_transfer_strategy_get_incentives_controller(strategy)
                == incentives_controller,
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            periphery_account = @aave_pool,
            incentives_controller = @0x111
        )
    ]
    fun test_pull_rewards_transfer_strategy_get_rewards_admin(
        aave_role_super_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );
        assert!(
            pull_rewards_transfer_strategy_get_rewards_admin(strategy)
                == signer::address_of(periphery_account),
            TEST_SUCCESS
        );
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            aave_pool = @aave_pool,
            aave_std = @aptos_std,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            incentives_controller = @0x111,
            user_account = @0x222
        )
    ]
    fun test_pull_rewards_transfer_strategy_perform_transfer(
        aave_role_super_admin: &signer,
        aave_pool: &signer,
        aave_std: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address,
        user_account: address
    ) {
        token_helper::init_reserves(
            aave_pool,
            aave_role_super_admin,
            aave_std,
            underlying_tokens_admin
        );

        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );

        let underlying_token_address =
            mock_underlying_token_factory::token_address(utf8(b"U_1"));

        let rewards_vault = pull_rewards_transfer_strategy_get_rewards_vault(strategy);
        let mint_amount = 100;
        // mint underlying token to rewards vault
        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            rewards_vault,
            mint_amount,
            underlying_token_address
        );

        // transfer underlying token
        pull_rewards_transfer_strategy_perform_transfer(
            incentives_controller,
            user_account,
            underlying_token_address,
            1,
            strategy
        );

        // mint aToken to rewards vault
        let reserve_data = pool::get_reserve_data(underlying_token_address);
        let a_token_address = pool::get_reserve_a_token_address(reserve_data);
        a_token_factory::mint_for_testing(
            @0x31,
            rewards_vault,
            (mint_amount as u256),
            wad_ray_math::ray(),
            a_token_address
        );
        // transfer aToken
        let transfer_amount = 1;
        pull_rewards_transfer_strategy_perform_transfer(
            incentives_controller,
            user_account,
            a_token_address,
            transfer_amount,
            strategy
        );

        // check rewards_vault balance
        let rewards_vault_balance =
            a_token_factory::balance_of(rewards_vault, a_token_address);
        assert!(
            rewards_vault_balance == (mint_amount as u256) - transfer_amount,
            TEST_SUCCESS
        );

        // check user_account balance
        let user_account_balance =
            a_token_factory::balance_of(user_account, a_token_address);
        assert!(user_account_balance == transfer_amount, TEST_SUCCESS);
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            aave_pool = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            incentives_controller = @0x111,
            user_account = @0x222
        )
    ]
    fun test_pull_rewards_transfer_strategy_emergency_withdrawal(
        aave_role_super_admin: &signer,
        aave_pool: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address,
        user_account: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );

        mock_underlying_token_factory::test_init_module(underlying_tokens_admin);
        let underlying_token_name = string::utf8(b"TOKEN_1");
        let underlying_token_symbol = string::utf8(b"T1");
        let underlying_token_decimals = 3;
        let underlying_token_max_supply = 10000;

        mock_underlying_token_factory::create_token(
            underlying_tokens_admin,
            underlying_token_max_supply,
            underlying_token_name,
            underlying_token_symbol,
            underlying_token_decimals,
            string::utf8(b""),
            string::utf8(b"")
        );
        let underlying_token_address =
            mock_underlying_token_factory::token_address(underlying_token_symbol);

        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            pull_rewards_transfer_strategy_get_rewards_vault(strategy),
            100,
            underlying_token_address
        );

        token_base::test_init_module(aave_pool);
        a_token_factory::test_init_module(aave_pool);
        variable_debt_token_factory::test_init_module(aave_pool);

        pull_rewards_transfer_strategy_perform_transfer(
            incentives_controller,
            user_account,
            underlying_token_address,
            1,
            strategy
        );

        pull_rewards_transfer_strategy_emergency_withdrawal(
            periphery_account,
            underlying_token_address,
            user_account,
            2,
            strategy
        );

        // check CancelStream emitted events
        let emitted_events = emitted_events<EmergencyWithdrawal>();
        // make sure event of type was emitted
        assert!(vector::length(&emitted_events) == 1, TEST_SUCCESS);
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            aave_pool = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            incentives_controller = @0x111,
            user_account = @0x222
        )
    ]
    #[expected_failure(abort_code = 3001, location = aave_pool::transfer_strategy)]
    fun test_pull_rewards_transfer_strategy_emergency_withdrawal_when_account_is_not_rewards_admin(
        aave_role_super_admin: &signer,
        aave_pool: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address,
        user_account: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );

        mock_underlying_token_factory::test_init_module(underlying_tokens_admin);
        let underlying_token_name = string::utf8(b"TOKEN_1");
        let underlying_token_symbol = string::utf8(b"T1");
        let underlying_token_decimals = 3;
        let underlying_token_max_supply = 10000;

        mock_underlying_token_factory::create_token(
            underlying_tokens_admin,
            underlying_token_max_supply,
            underlying_token_name,
            underlying_token_symbol,
            underlying_token_decimals,
            string::utf8(b""),
            string::utf8(b"")
        );
        let underlying_token_address =
            mock_underlying_token_factory::token_address(underlying_token_symbol);

        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            pull_rewards_transfer_strategy_get_rewards_vault(strategy),
            100,
            underlying_token_address
        );

        token_base::test_init_module(aave_pool);
        a_token_factory::test_init_module(aave_pool);
        variable_debt_token_factory::test_init_module(aave_pool);

        pull_rewards_transfer_strategy_perform_transfer(
            incentives_controller,
            user_account,
            underlying_token_address,
            1,
            strategy
        );

        pull_rewards_transfer_strategy_emergency_withdrawal(
            underlying_tokens_admin,
            underlying_token_address,
            user_account,
            2,
            strategy
        );
    }

    #[
        test(
            aave_role_super_admin = @aave_acl,
            aave_pool = @aave_pool,
            underlying_tokens_admin = @aave_mock_underlyings,
            periphery_account = @aave_pool,
            incentives_controller = @0x111,
            user_account = @0x222
        )
    ]
    #[expected_failure(abort_code = 3002, location = aave_pool::transfer_strategy)]
    fun test_pull_rewards_transfer_strategy_perform_transfer_when_incentives_controller_mismatch(
        aave_role_super_admin: &signer,
        aave_pool: &signer,
        underlying_tokens_admin: &signer,
        periphery_account: &signer,
        incentives_controller: address,
        user_account: address
    ) {
        acl_manage::test_init_module(aave_role_super_admin);
        acl_manage::add_emission_admin(
            aave_role_super_admin, signer::address_of(periphery_account)
        );

        let strategy =
            create_sample_pull_rewards_transfer_strategy(
                periphery_account, incentives_controller
            );

        mock_underlying_token_factory::test_init_module(underlying_tokens_admin);
        let underlying_token_name = string::utf8(b"TOKEN_1");
        let underlying_token_symbol = string::utf8(b"T1");
        let underlying_token_decimals = 3;
        let underlying_token_max_supply = 10000;

        mock_underlying_token_factory::create_token(
            underlying_tokens_admin,
            underlying_token_max_supply,
            underlying_token_name,
            underlying_token_symbol,
            underlying_token_decimals,
            string::utf8(b""),
            string::utf8(b"")
        );
        let underlying_token_address =
            mock_underlying_token_factory::token_address(underlying_token_symbol);

        mock_underlying_token_factory::mint(
            underlying_tokens_admin,
            pull_rewards_transfer_strategy_get_rewards_vault(strategy),
            100,
            underlying_token_address
        );

        token_base::test_init_module(aave_pool);
        a_token_factory::test_init_module(aave_pool);
        variable_debt_token_factory::test_init_module(aave_pool);

        pull_rewards_transfer_strategy_perform_transfer(
            @0x222,
            user_account,
            underlying_token_address,
            1,
            strategy
        );
    }

    #[test(aave_role_super_admin = @aave_acl, user1 = @0x31)]
    #[expected_failure(abort_code = 3008, location = aave_pool::transfer_strategy)]
    fun test_create_pull_rewards_transfer_strategy_with_not_emission_admin(
        aave_role_super_admin: &signer, user1: &signer
    ) {
        // init acl module
        acl_manage::test_init_module(aave_role_super_admin);

        let constructor_ref = object::create_sticky_object(signer::address_of(user1));
        let (_, rewards_vault) = account::create_resource_account(user1, b"");

        test_create_pull_rewards_transfer_strategy(
            user1,
            &constructor_ref,
            signer::address_of(user1),
            @0x111,
            rewards_vault
        );
    }
}
