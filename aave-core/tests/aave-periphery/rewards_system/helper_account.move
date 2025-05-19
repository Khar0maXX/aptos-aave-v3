#[test_only]
module aave_pool::helper_account {
    use std::bcs;
    use std::hash;
    use std::string::{utf8, String};
    use aptos_std::from_bcs;
    use aptos_std::string_utils::format1;
    use aptos_framework::account;

    friend aave_pool::helper_setup;

    /// Scheme identifier for test account
    const DERIVE_TEST_ACCOUNT_SCHEME: u8 = 101;

    /// Prefix to derive system account
    const PREFIX_SYS_ACCOUNT: vector<u8> = b"TEST_SYS_";

    /// Prefix to derive user account
    const PREFIX_USR_ACCOUNT: vector<u8> = b"TEST_USR_";

    /// Stateful information on test accounts
    struct Accounts has key {
        num_sys_account: u64,
        num_usr_account: u64
    }

    /// Initialize test account generator
    public(friend) fun initialize() {
        move_to(
            &account::create_signer_for_test(@aave_pool),
            Accounts { num_sys_account: 0, num_usr_account: 0 }
        )
    }

    /// Number of system accounts created
    public fun num_sys_accounts(): u64 acquires Accounts {
        borrow_global<Accounts>(@aave_pool).num_sys_account
    }

    /// Number of user accounts created
    public fun num_usr_accounts(): u64 acquires Accounts {
        borrow_global<Accounts>(@aave_pool).num_usr_account
    }

    /// Unique (and derived) address for an account
    fun account_address_unchecked(prefix: &String, uid: u64): address {
        let tag = *prefix;
        tag.append(format1(&b"{}", uid));

        let bytes = bcs::to_bytes(&@aave_pool);
        bytes.append(*tag.bytes());
        bytes.push_back(DERIVE_TEST_ACCOUNT_SCHEME);

        from_bcs::to_address(hash::sha3_256(bytes))
    }

    /// Create a new system account
    public fun new_sys_account(): signer acquires Accounts {
        let accounts = borrow_global_mut<Accounts>(@aave_pool);
        let signer =
            account::create_account_for_test(
                account_address_unchecked(
                    &utf8(PREFIX_SYS_ACCOUNT), accounts.num_sys_account
                )
            );
        accounts.num_sys_account += 1;
        signer
    }

    /// Create a new user account
    public fun new_usr_account(): signer acquires Accounts {
        let accounts = borrow_global_mut<Accounts>(@aave_pool);
        let signer =
            account::create_account_for_test(
                account_address_unchecked(
                    &utf8(PREFIX_USR_ACCOUNT), accounts.num_usr_account
                )
            );
        accounts.num_usr_account += 1;
        signer
    }

    /// Unique (and derived) address for a system account
    public fun sys_account_address(uid: u64): address acquires Accounts {
        assert!(uid < num_sys_accounts());
        account_address_unchecked(&utf8(PREFIX_SYS_ACCOUNT), uid)
    }

    /// Unique (and derived) address for a user account
    public fun usr_account_address(uid: u64): address acquires Accounts {
        assert!(uid < num_sys_accounts());
        account_address_unchecked(&utf8(PREFIX_USR_ACCOUNT), uid)
    }
}
