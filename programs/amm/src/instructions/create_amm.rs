use anchor_lang::prelude::*;
use anchor_spl::associated_token;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token;
use anchor_spl::token::*;

use crate::error::ErrorCode;
use crate::state::*;
use crate::BPS_SCALE;

#[derive(Accounts)]
#[instruction(create_amm_params: CreateAmmParams)]
pub struct CreateAmm<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<Amm>(),
        seeds = [
            base_mint.key().as_ref(),
            quote_mint.key().as_ref(),
            create_amm_params.swap_fee_bps.to_le_bytes().as_ref(),
            create_amm_params.permissioned_caller.unwrap_or(Pubkey::default()).as_ref()
        ],
        bump
    )]
    pub amm: Account<'info, Amm>,
    pub base_mint: Account<'info, Mint>,
    pub quote_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::authority = amm,
        associated_token::mint = base_mint
    )]
    pub vault_ata_base: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::authority = amm,
        associated_token::mint = quote_mint
    )]
    pub vault_ata_quote: Account<'info, TokenAccount>,
    #[account(address = associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Debug, Clone, Copy, AnchorSerialize, AnchorDeserialize, PartialEq, Eq)]
pub struct CreateAmmParams {
    pub permissioned: bool,
    pub permissioned_caller: Option<Pubkey>,
    pub swap_fee_bps: u64,
    pub ltwap_decimals: u8,
}

pub fn handler(ctx: Context<CreateAmm>, create_amm_params: CreateAmmParams) -> Result<()> {
    let CreateAmm {
        user: _,
        amm,
        base_mint,
        quote_mint,
        vault_ata_base: _,
        vault_ata_quote: _,
        associated_token_program: _,
        token_program: _,
        system_program: _,
    } = ctx.accounts;

    amm.permissioned = create_amm_params.permissioned;
    if amm.permissioned {
        amm.permissioned_caller = create_amm_params.permissioned_caller.unwrap();
    }

    amm.created_at_slot = Clock::get()?.slot;

    assert!((create_amm_params.swap_fee_bps as u64) < BPS_SCALE);
    assert!((create_amm_params.swap_fee_bps as u64) > 0);

    amm.swap_fee_bps = create_amm_params.swap_fee_bps;
    amm.ltwap_decimals = create_amm_params.ltwap_decimals;

    assert_ne!(base_mint.key(), quote_mint.key());

    amm.base_mint = base_mint.key();
    amm.quote_mint = quote_mint.key();

    amm.base_mint_decimals = base_mint.decimals;
    amm.quote_mint_decimals = quote_mint.decimals;

    amm.bump = ctx.bumps.amm;

    Ok(())
}
