import {AnchorProvider, Program} from "@coral-xyz/anchor";
import {
    AddressLookupTableAccount,
    Keypair,
    PublicKey,
    Signer,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import {Autocrat as AutocratIDLType} from '../../target/types/autocrat';
// @ts-ignore
import * as IDL from '../../target/idl/autocrat.json';
import * as ixs from "./instructions";
import BN from "bn.js";
import {addComputeUnits} from "./utils";
import { AUTOCRAT_LUTS, AUTOCRAT_PROGRAM_ID } from "./constants";
import { ProposalInstruction, UpdateDaoParams } from "./types";

export class AutocratClient {
    public readonly provider: AnchorProvider;
    public readonly program: Program<AutocratIDLType>;
    public readonly luts: AddressLookupTableAccount[];

    constructor(
        provider: AnchorProvider,
        programId: PublicKey,
        luts: AddressLookupTableAccount[],
    ) {
        this.provider = provider
        this.program = new Program<AutocratIDLType>(IDL, programId, provider)
        this.luts = luts
    }

    public static async createClient(provider: AnchorProvider, programId?: PublicKey): Promise<AutocratClient> {
        const getLuts = () => Promise.all(
            AUTOCRAT_LUTS.map(lut => {
                return provider.connection
                    .getAddressLookupTable(lut)
                    .then((res) => res.value as AddressLookupTableAccount)
            })
        )

        const luts = await getLuts()

        return new AutocratClient(
            provider,
            programId || AUTOCRAT_PROGRAM_ID,
            luts as AddressLookupTableAccount[],
        )
    }

    async initializeDao(
        metaMint?: PublicKey,
        usdcMint?: PublicKey
    ) {
        return ixs.initializeDaoHandler(
            this,
            metaMint,
            usdcMint
        )
    }

    // this won't ever be called directly (must be called via a proposal), but is here anyway for completeness / testing
    async updateDao(
        updateDaoParams: UpdateDaoParams
    ) {
        return ixs.updateDaoHandler(
            this,
            updateDaoParams
        )
    }

    async createProposalInstructions(
        instructions: ProposalInstruction[],
        proposalInstructionsKeypair: Keypair,
    ) {
        return ixs.createProposalInstructionsHandler(
            this,
            instructions,
            proposalInstructionsKeypair
        )
    }

    async addProposalInstructions(
        instructions: ProposalInstruction[],
        proposalInstructionsAddr: PublicKey,
    ) {
        return ixs.addProposalInstructionsHandler(
            this,
            instructions,
            proposalInstructionsAddr
        )
    }

    async createProposalPartOne(
        descriptionUrl: string,
        proposalInstructionsAddr: PublicKey,
    ) {
        return ixs.createProposalPartOneHandler(
            this,
            descriptionUrl,
            proposalInstructionsAddr
        )
    }

    async createProposalPartTwo(
        initialPassMarketPriceUnits: number,
        initialFailMarketPriceUnits: number,
        quoteLiquidityAtomsPerAmm: BN,
    ) {
        return ixs.createProposalPartTwoHandler(
            this,
            initialPassMarketPriceUnits,
            initialFailMarketPriceUnits,
            quoteLiquidityAtomsPerAmm,
        )
    }

    async mintConditionalTokens(
        metaAmount: BN,
        usdcAmount: BN,
        proposalNumber: number
    ) {
        return ixs.mintConditionalTokensHandler(
            this,
            metaAmount,
            usdcAmount,
            proposalNumber,
        )
    }

    async redeemConditionalTokens(
        proposalNumber: number
    ) {
        return ixs.redeemConditionalTokensHandler(
            this,
            proposalNumber,
        )
    }

    async finalizeProposal(
        proposalNumber: number
    ) {
        return ixs.finalizeProposalHandler(
            this,
            proposalNumber,
        )
    }

    async createAmmPosition(
        amm: PublicKey
    ) {
        return ixs.createAmmPositionHandler(
            this,
            amm
        )
    }

    async addLiquidity(
        maxBaseAmount: BN,
        maxQuoteAmount: BN,
        isPassMarket: boolean,
        proposalNumber: number
    ) {
        return ixs.addLiquidityHandler(
            this,
            maxBaseAmount,
            maxQuoteAmount,
            isPassMarket,
            proposalNumber
        )
    }
    
    async removeLiquidity(
        removeBps: BN,
        isPassMarket: boolean,
        proposalNumber: number
    ) {
        return ixs.removeLiquidityHandler(
            this,
            removeBps,
            isPassMarket,
            proposalNumber
        )
    }

    async swap(
        isQuoteToBase: boolean,
        inputAmount: BN,
        minOutputAmount: BN,
        isPassMarket: boolean,
        proposalNumber: number
    ) {
        return ixs.swapHandler(
            this,
            isQuoteToBase,
            inputAmount,
            minOutputAmount,
            isPassMarket,
            proposalNumber
        )
    }

}

