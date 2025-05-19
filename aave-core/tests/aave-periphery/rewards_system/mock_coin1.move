#[test_only]
module aave_pool::mock_coin1 {
    use std::option;
    use std::string;
    use aptos_framework::fungible_asset;
    use aptos_framework::fungible_asset::{Metadata, MintRef, BurnRef, TransferRef};
    use aptos_framework::object;
    use aptos_framework::object::Object;
    use aptos_framework::primary_fungible_store;

    const ASSET_SYMBOL: vector<u8> = b"MOCK1";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    /// Hold refs to mint, burn, and transfer of the underlying FA
    struct Caps has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef
    }

    public fun initialize(sender: &signer) {
        let constructor_ref = object::create_named_object(sender, ASSET_SYMBOL);

        // create token
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::none(),
            string::utf8(ASSET_SYMBOL),
            string::utf8(ASSET_SYMBOL),
            6,
            string::utf8(b""),
            string::utf8(b"")
        );

        // create a one-off signer for `move_to` operations
        let object_signer = object::generate_signer(&constructor_ref);

        // create capabilities
        let mint_ref = fungible_asset::generate_mint_ref(&constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(&constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(&constructor_ref);

        // save the capabilities
        move_to(
            &object_signer,
            Caps { mint_ref, burn_ref, transfer_ref }
        );
    }

    public fun mint<T: key>(store: Object<T>, amount: u64) acquires Caps {
        let token = fungible_asset::store_metadata(store);
        let caps = borrow_global<Caps>(object::object_address(&token));
        fungible_asset::mint_to(&caps.mint_ref, store, amount);
    }

    public fun burn<T: key>(store: Object<T>, amount: u64) acquires Caps {
        let token = fungible_asset::store_metadata(store);
        let caps = borrow_global<Caps>(object::object_address(&token));
        fungible_asset::burn_from(&caps.burn_ref, store, amount);
    }

    public fun token_metadata(creator: address): Object<Metadata> {
        object::address_to_object(
            object::create_object_address(&creator, ASSET_SYMBOL)
        )
    }
}
