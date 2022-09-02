import { IndexedTx, BroadcastTxResponse } from '@cosmjs/stargate';

export type Network = {
  provider: string;
  transactionLink: (arg0: string) => string;
  walletLink: (arg0: string) => string;
  networkName: string;
  bech32Prefix: string;
  nativeDenom: string;
  defaultTxFee: number;
  defaultGas: number;
  chainId?: string;
};

export type GetTransactionResult = {
  transactionData: IndexedTx;
  receipt: {
    amount: number;
    date: Date;
    from: string;
    gasCostCryptoCurrency: string;
    gasCostInCrypto: number;
    gasLimit: number;
    gasPrice: number;
    isPending: boolean;
    isExecuted: boolean;
    isSuccessful: boolean;
    isFailed: boolean;
    isInvalid: boolean;
    network: string;
    nonce: number;
    to: string;
    transactionHash: string;
    transactionLink: string;
  };
};

export type SendTransactionParams = {
  to: string;
  amount: number;
  network: string;
  mnemonic: string;
  denom: string;
  decimals: number;
};

export type SendTransactionResult = {
  transactionData: BroadcastTxResponse;
  receipt: {
    amount: number;
    date: Date;
    from: string;
    gasCostCryptoCurrency: string;
    gasCostInCrypto: number;
    gasLimit: number;
    gasPrice: number;
    network: string;
    nonce: number;
    to: string;
    transactionHash: string;
    transactionLink: string;
  };
};
