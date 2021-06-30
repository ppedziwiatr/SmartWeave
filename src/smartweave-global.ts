import Arweave from 'arweave';
import { InteractionTx } from './interaction-tx';
import { readContract } from './contract-read';
import {interactRead} from "./contract-interact";
import {OptionalWallet} from "./utils";

/**
 *
 * This class is be exposed as a global for contracts
 * as 'SmartWeave' and provides an API for getting further
 * information or using utility and crypto functions from
 * inside the contracts execution.
 *
 * It provides an api:
 *
 * - SmartWeave.transaction.id
 * - SmartWeave.transaction.reward
 * - SmartWeave.block.height
 * - SmartWeave.block.timestamp
 * - etc
 *
 * and access to some of the arweave utils:
 * - SmartWeave.arweave.utils
 * - SmartWeave.arweave.crypto
 * - SmartWeave.arweave.wallets
 * - SmartWeave.arweave.ar
 *
 * as well as access to the potentially non-deterministic full client:
 * - SmartWeave.unsafeClient
 *
 */
export class SmartWeaveGlobal {
  transaction: Transaction;
  block: Block;
  arweave: Pick<Arweave, 'ar' | 'wallets' | 'utils' | 'crypto'>;
  contract: {
    id: string;
    owner: string;
  };
  unsafeClient: Arweave;
  wallet: OptionalWallet; // wallet of the caller that is interacting with the contract.

  contracts: {
    readContractState: (contractId: string) => Promise<any>;
    interactReadResult: (contractId: string, input: any) => Promise<any>;
  };

  _activeTx?: InteractionTx;

  get _isDryRunning() {
    return !this._activeTx;
  }

  constructor(arweave: Arweave, contract: { id: string; owner: string }, wallet: OptionalWallet) {
    this.unsafeClient = arweave;
    this.arweave = {
      ar: arweave.ar,
      utils: arweave.utils,
      wallets: arweave.wallets,
      crypto: arweave.crypto,
    };
    this.contract = contract;
    this.transaction = new Transaction(this);
    this.block = new Block(this);
    this.contracts = {
      readContractState: (contractId: string, height?: number, returnValidity?: boolean) =>
        readContract(
          arweave,
          contractId,
          height || (this._isDryRunning ? Number.POSITIVE_INFINITY : this.block.height),
          returnValidity,
        ),
      interactReadResult: (calleContractTxId: string, input: any): Promise<any> => {
        if (wallet === undefined) {
          throw `Caller's wallet not set in SmartWeaveGlobal and is to call interactRead on other contract. 
          Did you forget to pass wallet to the originally called SDK function?
          `;
          // alternatively return here sth like "{result: 'error-no-wallet'}",
          // as handling such case might be handled by contract itself.
        }
        return interactRead(
          arweave,
          wallet,
          calleContractTxId,
          input);
      }
    };
    this.wallet = wallet;
  }
}

// tslint:disable-next-line: max-classes-per-file
class Transaction {
  constructor(private readonly global: SmartWeaveGlobal) {}

  get id() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.id;
  }

  get owner() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.owner.address;
  }

  get target() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.recipient;
  }

  get tags() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.tags;
  }

  get quantity() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.quantity.winston;
  }

  get reward() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.fee.winston;
  }
}

// tslint:disable-next-line: max-classes-per-file
class Block {
  constructor(private readonly global: SmartWeaveGlobal) {}

  get height() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.block.height;
  }

  get indep_hash() {
    if (!this.global._activeTx) {
      throw new Error('No current Tx');
    }
    return this.global._activeTx.block.id;
  }

  get timestamp() {
    if (!this.global._activeTx) {
      throw new Error('No current tx');
    }
    return this.global._activeTx.block.timestamp;
  }
}
