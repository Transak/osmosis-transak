import { Network } from './types';

export const networks: Record<string, Network> = {
  main: {
    provider: 'https://rpc.osmosis.zone',
    transactionLink: hash => `https://www.mintscan.io/osmosis/txs/${hash}`,
    walletLink: address => `https://www.mintscan.io/osmosis/account/${address}`,
    networkName: 'osmosis',
    chainId: 'osmosis-1',
    bech32Prefix: 'osmo',
    nativeDenom: 'uosmo',
    defaultTxFee: 0,
    defaultGas: 200000,
  },
  testnet: {
    provider: 'https://rpc-test.osmosis.zone',
    transactionLink: hash => `https://www.mintscan.io/osmosis/txs/${hash}`,
    walletLink: address => `https://www.mintscan.io/osmosis/account/${address}`,
    networkName: 'osmosis',
    chainId: 'osmo-test-4',
    bech32Prefix: 'osmo',
    nativeDenom: 'uosmo',
    defaultTxFee: 0,
    defaultGas: 200000,
  },
};

module.exports = { networks };
