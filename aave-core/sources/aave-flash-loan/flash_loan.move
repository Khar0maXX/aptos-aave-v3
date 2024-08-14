/// @title flashloan_logic module
/// @author Aave
/// @notice Implements the logic for the flash loans
module aave_pool::flashloan_logic {
    use std::option::Option;
    use std::option::Self;
    use std::signer;
    use std::vector;
    use aptos_framework::event;

    use aave_acl::acl_manage;
    use aave_config::error as error_config;
    use aave_config::error::{Self};
    use aave_config::user as user_config;
    use aave_math::math_utils;
    use aave_math::wad_ray_math;

    use aave_pool::a_token_factory;
    use aave_pool::borrow_logic;
    use aave_pool::mock_underlying_token_factory::Self;
    use aave_pool::pool;
    use aave_pool::pool::ReserveData;
    use aave_pool::validation_logic::Self;

    //// ================= STRUCTS ==================== ///
    #[event]
    /// @dev Emitted on flashLoan()
    /// @param target The address of the flash loan receiver contract
    /// @param initiator The address initiating the flash loan
    /// @param asset The address of the asset being flash borrowed
    /// @param amount The amount flash borrowed
    /// @param interest_rate_mode The flashloan mode: 0 for regular flashloan, 2 for Variable debt
    /// @param premium The fee flash borrowed
    /// @param referral_code The referral code used
    struct FlashLoan has store, drop {
        target: address,
        initiator: address,
        asset: address,
        amount: u256,
        interest_rate_mode: u8,
        premium: u256,
        referral_code: u16,
    }

    /// Helper struct for internal variables used in the `executeFlashLoan` function
    struct FlashLoanLocalVars has copy, drop {
        sender: address,
        receiver: address,
        i: u256,
        current_asset: address,
        current_amount: u256,
        total_premium: u256,
        flashloan_premium_total: u256,
        flashloan_premium_to_protocol: u256,
    }

    struct SimpleFlashLoansReceipt {
        sender: address,
        receiver: address,
        i: u256,
        current_asset: address,
        current_amount: u256,
        total_premium: u256,
        flashloan_premium_total: u256,
        flashloan_premium_to_protocol: u256,
        referral_code: u16,
        interest_rate_mode: Option<u8>,
        on_behalf_of: address,
    }

    struct ComplexFlashLoansReceipt {
        sender: address,
        receiver: address,
        i: u256,
        current_asset: address,
        current_amount: u256,
        total_premium: u256,
        flashloan_premium_total: u256,
        flashloan_premium_to_protocol: u256,
        referral_code: u16,
        interest_rate_mode: Option<u8>,
        on_behalf_of: address,
    }

    struct FlashLoanRepaymentParams has drop {
        amount: u256,
        total_premium: u256,
        flashloan_premium_to_protocol: u256,
        asset: address,
        receiver_address: address,
        referral_code: u16,
    }

    //// ================= METHODS ==================== ///
    /// @notice Allows smartcontracts to access the liquidity of the pool within one transaction,
    /// as long as the amount taken plus a fee is returned.
    /// @dev IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept
    /// into consideration. For further details please visit https://docs.aave.com/developers/
    /// @param receiver_address The address of the contract receiving the funds
    /// @param assets The addresses of the assets being flash-borrowed
    /// @param amounts The amounts of the assets being flash-borrowed
    /// @param interest_rate_modes Types of the debt to open if the flash loan is not returned:
    ///   0 -> Don't open any debt, just revert if funds can't be transferred from the receiver
    ///   2 -> Open debt at variable rate for the value of the amount flash-borrowed to the `onBehalfOf` address
    /// @param on_behalf_of The address  that will receive the debt in the case of using on `modes` 2
    /// @param referral_code The code used to register the integrator originating the operation, for potential rewards.
    ///   0 if the action is executed directly by the user, without any middle-man
    public fun flashloan(
        account: &signer,
        receiver_address: address,
        assets: vector<address>,
        amounts: vector<u256>,
        interest_rate_modes: vector<u8>,
        on_behalf_of: address,
        referral_code: u16,
    ): vector<ComplexFlashLoansReceipt> {
        execute_flash_loan_complex(
            account,
            receiver_address,
            assets,
            amounts,
            interest_rate_modes,
            on_behalf_of,
            referral_code,
            (pool::get_flashloan_premium_to_protocol() as u256),
            (pool::get_flashloan_premium_total() as u256),
            acl_manage::is_flash_borrower(signer::address_of(account)),
        )
    }

    fun execute_flash_loan_complex(
        account: &signer,
        receiver_address: address,
        assets: vector<address>,
        amounts: vector<u256>,
        interest_rate_modes: vector<u8>,
        on_behalf_of: address,
        referral_code: u16,
        flash_loan_premium_to_protocol: u256,
        flash_loan_premium_total: u256,
        is_authorized_flash_borrower: bool,
    ): vector<ComplexFlashLoansReceipt> {
        // get signer account
        let account_address = signer::address_of(account);
        assert!(
            account_address == on_behalf_of,
            error_config::get_esigner_and_on_behalf_of_no_same(),
        );
        // get all reserves data
        let reservesData = vector::map_ref<address, ReserveData>(
            &assets,
            |asset| {
                let reserve_data = pool::get_reserve_data(*asset);
                reserve_data
            },
        );

        // validate flashloans logic
        validation_logic::validate_flashloan_complex(&reservesData, &assets, &amounts);

        // validate interest rates
        assert!(
            !vector::any(
                &interest_rate_modes,
                |interest_rate| {
                    let legitimate_interes_rate =
                        *interest_rate == user_config::get_interest_rate_mode_none()
                            || *interest_rate
                                == user_config::get_interest_rate_mode_variable();
                    !legitimate_interes_rate
                },
            ),
            error::get_einvalid_interest_rate_mode_selected(),
        );

        let flashloan_premium_total =
            if (is_authorized_flash_borrower) { 0 }
            else {
                flash_loan_premium_total
            };
        let flashloan_premium_to_protocol =
            if (is_authorized_flash_borrower) { 0 }
            else {
                flash_loan_premium_to_protocol
            };
        let flashloans = vector<FlashLoanLocalVars>[];

        for (i in 0..vector::length(&assets)) {
            // calculate premiums
            let total_premium =
                if (*vector::borrow(&interest_rate_modes, i)
                        == user_config::get_interest_rate_mode_none()) {
                    math_utils::percent_mul(
                        *vector::borrow(&amounts, i), flashloan_premium_total
                    )
                } else { 0 };

            let flashloan_vars = FlashLoanLocalVars {
                sender: account_address,
                receiver: receiver_address,
                i: (i as u256),
                current_asset: *vector::borrow(&assets, i),
                current_amount: *vector::borrow(&amounts, i),
                total_premium,
                flashloan_premium_total,
                flashloan_premium_to_protocol,
            };

            // transfer the underlying to the receiver
            transfer_underlying_to(&flashloan_vars);

            // save the taken flashloan
            vector::push_back(&mut flashloans, flashloan_vars);
        };

        let flashloan_receipts = vector::map<FlashLoanLocalVars, ComplexFlashLoansReceipt>(
            flashloans,
            |flashloan| {
                let flashloan: FlashLoanLocalVars = flashloan;
                let interest_rate_mode =
                    *vector::borrow(&interest_rate_modes, (flashloan.i as u64));
                create_complex_flashloan_receipt(
                    &flashloan,
                    account_address,
                    referral_code,
                    on_behalf_of,
                    option::some(interest_rate_mode),
                )
            },
        );

        flashloan_receipts
    }

    public fun pay_flash_loan_complex(
        account: &signer, flashloan_receipts: vector<ComplexFlashLoansReceipt>
    ) {
        // get the payer account
        let account_address = signer::address_of(account);

        // destroy all receipts and handle their repayment
        vector::destroy(
            flashloan_receipts,
            |flashloan| {
                let ComplexFlashLoansReceipt {
                    sender: _,
                    receiver,
                    i: _,
                    current_asset,
                    current_amount,
                    total_premium,
                    flashloan_premium_total: _,
                    flashloan_premium_to_protocol,
                    referral_code,
                    interest_rate_mode,
                    on_behalf_of
                } = flashloan;

                // check the signer is the receiver that the receipt was issued for
                assert!(
                    signer::address_of(account) == receiver,
                    error::get_flashloan_payer_not_receiver(),
                );

                if (*option::borrow(&interest_rate_mode)
                        == user_config::get_interest_rate_mode_none()) {
                    // do flashloan repayment
                    let repayment_params = FlashLoanRepaymentParams {
                        amount: current_amount,
                        total_premium,
                        flashloan_premium_to_protocol,
                        asset: current_asset,
                        receiver_address: receiver,
                        referral_code,
                    };
                    handle_flash_loan_repayment(account, &repayment_params);
                } else {
                    // If the user chose to not return the funds, the system checks if there is enough collateral and
                    // eventually opens a debt position
                    borrow_logic::internal_borrow(
                        account, // account
                        current_asset, // asset
                        current_amount, // amount
                        *option::borrow(&interest_rate_mode), //interest_rate_mode
                        referral_code, // referral_code
                        on_behalf_of, // on behalf of,
                        false, // release_underlying
                    );
                    event::emit(
                        FlashLoan {
                            target: receiver,
                            initiator: account_address,
                            asset: current_asset,
                            amount: current_amount,
                            interest_rate_mode: *option::borrow(&interest_rate_mode),
                            premium: 0,
                            referral_code,
                        },
                    );
                };
            },
        )
    }

    fun create_simple_flashloan_receipt(
        flashloan: &FlashLoanLocalVars,
        sender: address,
        referral_code: u16,
        on_behalf_of: address,
        interest_rate_mode: Option<u8>
    ): SimpleFlashLoansReceipt {
        SimpleFlashLoansReceipt {
            sender,
            receiver: flashloan.receiver,
            i: flashloan.i,
            current_asset: flashloan.current_asset,
            current_amount: flashloan.current_amount,
            total_premium: flashloan.total_premium,
            flashloan_premium_total: flashloan.flashloan_premium_total,
            flashloan_premium_to_protocol: flashloan.flashloan_premium_to_protocol,
            referral_code,
            on_behalf_of,
            interest_rate_mode,
        }
    }

    fun create_complex_flashloan_receipt(
        flashloan: &FlashLoanLocalVars,
        sender: address,
        referral_code: u16,
        on_behalf_of: address,
        interest_rate_mode: Option<u8>
    ): ComplexFlashLoansReceipt {
        ComplexFlashLoansReceipt {
            sender,
            receiver: flashloan.receiver,
            i: flashloan.i,
            current_asset: flashloan.current_asset,
            current_amount: flashloan.current_amount,
            total_premium: flashloan.total_premium,
            flashloan_premium_total: flashloan.flashloan_premium_total,
            flashloan_premium_to_protocol: flashloan.flashloan_premium_to_protocol,
            referral_code,
            on_behalf_of,
            interest_rate_mode,
        }
    }

    fun transfer_underlying_to(flashloan_vars: &FlashLoanLocalVars) {
        let reserve_data = pool::get_reserve_data(flashloan_vars.current_asset);
        let a_token_address = pool::get_reserve_a_token_address(&reserve_data);
        a_token_factory::transfer_underlying_to(
            flashloan_vars.receiver, flashloan_vars.current_amount, a_token_address
        )
    }

    /// @notice Allows smartcontracts to access the liquidity of the pool within one transaction,
    /// as long as the amount taken plus a fee is returned.
    /// @dev IMPORTANT There are security concerns for developers of flashloan receiver contracts that must be kept
    /// into consideration. For further details please visit https://docs.aave.com/developers/
    /// @param receiver_address The address of the contract receiving the funds
    /// @param asset The address of the asset being flash-borrowed
    /// @param amount The amount of the asset being flash-borrowed
    /// @param referral_code The code used to register the integrator originating the operation, for potential rewards.
    ///  0 if the action is executed directly by the user, without any middle-man
    public fun flash_loan_simple(
        account: &signer,
        receiver_address: address,
        asset: address,
        amount: u256,
        referral_code: u16
    ): SimpleFlashLoansReceipt {
        execute_flash_loan_simple(
            account,
            receiver_address,
            asset,
            amount,
            referral_code,
            (pool::get_flashloan_premium_to_protocol() as u256),
            (pool::get_flashloan_premium_total() as u256),
        )
    }

    fun execute_flash_loan_simple(
        account: &signer,
        receiver_address: address,
        asset: address,
        amount: u256,
        referral_code: u16,
        flashloan_premium_to_protocol: u256,
        flashloan_premium_total: u256
    ): SimpleFlashLoansReceipt {
        // sender account address
        let account_address = signer::address_of(account);

        // get the reserve data
        let reserve_data = pool::get_reserve_data(asset);

        // validate flashloan logic
        validation_logic::validate_flashloan_simple(&reserve_data);

        // create flashloan
        let flashloan = FlashLoanLocalVars {
            sender: account_address,
            receiver: receiver_address,
            i: 0,
            current_asset: asset,
            current_amount: amount,
            total_premium: math_utils::percent_mul(amount, flashloan_premium_total),
            flashloan_premium_total,
            flashloan_premium_to_protocol,
        };

        // transfer the underlying to the receiver
        transfer_underlying_to(&flashloan);

        // create and return the flashloan receipt
        let flashloan_receipt =
            create_simple_flashloan_receipt(
                &flashloan,
                account_address,
                referral_code,
                receiver_address,
                option::none(),
            );

        flashloan_receipt
    }

    public fun pay_flash_loan_simple(
        account: &signer, flashloan_receipt: SimpleFlashLoansReceipt
    ) {
        // destructure the receipt
        let SimpleFlashLoansReceipt {
            sender: _,
            receiver,
            i: _,
            current_asset,
            current_amount,
            total_premium,
            flashloan_premium_total: _,
            flashloan_premium_to_protocol,
            referral_code,
            interest_rate_mode: _,
            on_behalf_of: _
        } = flashloan_receipt;

        // check the signer is the receiver that the receipt was issued for
        assert!(
            signer::address_of(account) == receiver,
            error::get_flashloan_payer_not_receiver(),
        );

        // do flashloan repayment
        let repayment_params = FlashLoanRepaymentParams {
            amount: current_amount,
            total_premium,
            flashloan_premium_to_protocol,
            asset: current_asset,
            receiver_address: receiver,
            referral_code,
        };
        handle_flash_loan_repayment(account, &repayment_params);
    }

    /// @notice Handles repayment of flashloaned assets + premium
    /// @dev Will pull the amount + premium from the receiver, so must have approved pool
    /// @param params The additional parameters needed to execute the repayment function
    fun handle_flash_loan_repayment(
        account: &signer, repayment_params: &FlashLoanRepaymentParams
    ) {
        // get the reserve data
        let reserve_data = pool::get_reserve_data(repayment_params.asset);
        let a_token_address = pool::get_reserve_a_token_address(&reserve_data);

        // compute amount plus premiums
        let premium_to_protocol =
            math_utils::percent_mul(
                repayment_params.total_premium,
                repayment_params.flashloan_premium_to_protocol,
            );
        let premium_to_lp = repayment_params.total_premium - premium_to_protocol;
        let amount_plus_premium = repayment_params.amount + repayment_params.total_premium;

        // update the pool state
        pool::update_state(repayment_params.asset, &mut reserve_data);

        // update liquidity index
        let a_token_supply = pool::scaled_a_token_total_supply(a_token_address);
        let reserve_accrued_to_treasury =
            pool::get_reserve_accrued_to_treasury(&reserve_data);
        let reserve_liquidity_index = pool::get_reserve_liquidity_index(&reserve_data);
        let total_liq =
            a_token_supply
                + wad_ray_math::ray_mul(
                    reserve_accrued_to_treasury, (reserve_liquidity_index as u256)
                );
        let next_liquidity_index =
            pool::cumulate_to_liquidity_index(
                repayment_params.asset,
                &mut reserve_data,
                total_liq,
                premium_to_lp,
            );

        // update accrued to treasury
        let new_reserve_accrued_to_treasury =
            reserve_accrued_to_treasury
                + wad_ray_math::ray_div(premium_to_protocol, next_liquidity_index);
        pool::set_reserve_accrued_to_treasury(
            repayment_params.asset, new_reserve_accrued_to_treasury
        );

        // update pool interest rates
        pool::update_interest_rates(
            &mut reserve_data,
            repayment_params.asset,
            amount_plus_premium,
            0,
        );

        // transfer underlying tokens
        let a_token_account_address =
            a_token_factory::get_token_account_address(a_token_address);
        mock_underlying_token_factory::transfer_from(
            repayment_params.receiver_address,
            a_token_account_address,
            (amount_plus_premium as u64),
            repayment_params.asset,
        );

        // handle the a token repayment
        a_token_factory::handle_repayment(
            repayment_params.receiver_address,
            repayment_params.receiver_address,
            amount_plus_premium,
            a_token_address,
        );

        event::emit(
            FlashLoan {
                target: repayment_params.receiver_address,
                initiator: signer::address_of(account),
                asset: repayment_params.asset,
                amount: repayment_params.amount,
                interest_rate_mode: user_config::get_interest_rate_mode_none(),
                premium: repayment_params.total_premium,
                referral_code: repayment_params.referral_code,
            },
        )
    }
}
