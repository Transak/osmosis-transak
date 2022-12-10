import { Network } from './types';

export const networks: Record<string, Network> = {
  main: {
    provider: `https://osmosis-mainnet-rpc.allthatnode.com:26657/${process.env.ALLTHATNODEAPIKEY}`,
    transactionLink: hash => `https://www.mintscan.io/osmosis/txs/${hash}`,
    walletLink: address => `https://www.mintscan.io/osmosis/account/${address}`,
    networkName: 'osmosis',
    chainId: 'osmosis-1',
    bech32Prefix: 'osmo',
    nativeDenom: 'uosmo',
    defaultTxFee: 2000,
    defaultGas: 250000,
  },
  testnet: {
    provider: `https://osmosis-testnet-rpc.allthatnode.com:26657/${process.env.ALLTHATNODEAPIKEY}`,
    transactionLink: hash => `https://www.mintscan.io/osmosis/txs/${hash}`,
    walletLink: address => `https://www.mintscan.io/osmosis/account/${address}`,
    networkName: 'osmosis',
    chainId: 'osmo-test-4',
    bech32Prefix: 'osmo',
    nativeDenom: 'uosmo',
    defaultTxFee: 2000,
    defaultGas: 250000,
  },
};

module.exports = { networks };
