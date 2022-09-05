import { networks } from './config';
import {
  Network,
  GetTransactionResult,
  SendTransactionResult,
  SendTransactionParams,
} from './types';
import {
  StargateClient,
  SigningStargateClient,
  isAminoMsgSend,
  AminoTypes,
  isMsgSendEncodeObject,
  IndexedTx,
} from '@cosmjs/stargate';
import {
  OfflineSigner,
  DirectSecp256k1HdWallet,
  decodeTxRaw,
  Registry,
  DecodedTxRaw,
  DecodeObject,
  EncodeObject,
} from '@cosmjs/proto-signing';
import { AminoMsg, StdFee } from '@cosmjs/amino';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import * as ethers from 'ethers';

const validWallet = /osmo1[a-z0-9]{38}/g;

// returns string
const _toDecimal = (amount: string, decimals: number) =>
  ethers.utils.formatUnits(amount, decimals);
// returns ethers.BigNumber
const _toCrypto = (amount: string, decimals: number) =>
  ethers.utils.parseUnits(amount, decimals);

const getNetwork = (network: string) =>
  (network === 'main' ? networks[network] : networks.testnet) as Network;

const isValidWalletAddress = (address: string) =>
  new RegExp(validWallet).test(address) as boolean;

const getTransactionLink = (txId: string, network: string) =>
  getNetwork(network).transactionLink(txId) as string;

const getWalletLink = (walletAddress: string, network: string) =>
  getNetwork(network).walletLink(walletAddress) as string;

const getDefaultGasPrice = (network: string) =>
  (getNetwork(network).defaultTxFee / getNetwork(network).defaultGas) as number;

function getDefaultStdFee(network: string): StdFee {
  const net = getNetwork(network);
  return {
    amount: [
      {
        amount: net.defaultTxFee.toString(),
        denom: net.nativeDenom,
      },
    ],
    gas: net.defaultGas.toString(),
  };
}

async function getOsmosisClient(network: string): Promise<StargateClient> {
  const net = getNetwork(network);
  return await StargateClient.connect(net.provider);
}

async function getSigningOsmosisClient(
  network: string,
  signer: OfflineSigner,
): Promise<SigningStargateClient> {
  const net = getNetwork(network);
  return await SigningStargateClient.connectWithSigner(net.provider, signer, {
    prefix: net.bech32Prefix,
  });
}

async function getTransaction(
  txId: string,
  network: string,
  decimals = 6,
): Promise<GetTransactionResult | null> {
  const client = await getOsmosisClient(network);
  const indexedTx = (await client.getTx(txId)) as IndexedTx;
  const rawTx = decodeTxRaw(indexedTx.tx) as DecodedTxRaw;
  if (rawTx === null) {
    return null;
  }
  const msgSend: MsgSend = getMsgSend(rawTx.body.messages[0]);

  const feeInDenom = rawTx.authInfo.fee
    ? rawTx.authInfo.fee.amount[0].amount
    : '';
  const gasCostInCrypto = feeInDenom
    ? Number(_toCrypto(feeInDenom, decimals))
    : 0;

  return {
    transactionData: indexedTx,
    receipt: {
      amount: Number(_toDecimal(msgSend.amount[0].amount, decimals)) ?? 0,
      date: new Date(
        Date.parse((await client.getBlock(indexedTx.height)).header.time),
      ),
      from: msgSend.fromAddress ?? '',
      gasCostCryptoCurrency: 'OSMO',
      gasCostInCrypto,
      gasLimit: indexedTx.gasWanted,
      gasPrice: gasCostInCrypto / indexedTx.gasWanted,
      isPending: false,
      isExecuted: true,
      isSuccessful: indexedTx.code === 0,
      isFailed: indexedTx.code !== 0,
      isInvalid: indexedTx.code !== 0,
      network,
      nonce: rawTx.authInfo.signerInfos[0].sequence.toNumber(),
      to: msgSend.toAddress ?? '',
      transactionHash: indexedTx.hash,
      transactionLink: getTransactionLink(indexedTx.hash, network),
    },
  };
}

async function getBalance(
  address: string,
  network: string,
  denom: string,
  decimals: number,
): Promise<number> {
  const client = await getOsmosisClient(network);
  const balance = await client.getBalance(address, denom);
  return Number(_toDecimal(balance.amount, decimals));
}

async function sendTransaction({
  to,
  amount,
  network,
  mnemonic,
  denom,
  decimals,
}: SendTransactionParams): Promise<SendTransactionResult> {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: getNetwork(network).bech32Prefix,
  });
  const signingClient = await getSigningOsmosisClient(network, signer);

  // amount in lowest denomination example OSMO to uosmo
  const amountInCrypto = _toCrypto(amount.toString(), decimals);
  const accs = await signer.getAccounts();

  const sendAmt: Coin[] = [{ denom, amount: amountInCrypto.toString() }];

  const fee = getDefaultStdFee(network);

  const broadcastTxResponse = await signingClient.sendTokens(
    accs[0].address,
    to,
    sendAmt,
    fee,
  );

  return {
    transactionData: broadcastTxResponse,
    receipt: {
      amount,
      date: new Date(
        Date.parse(
          (await signingClient.getBlock(broadcastTxResponse.height)).header
            .time,
        ),
      ),
      from: accs[0].address,
      gasCostCryptoCurrency: 'OSMO',
      gasCostInCrypto: Number(_toDecimal(fee.amount[0].amount, decimals)),
      gasLimit: Number(fee.gas),
      gasPrice: getDefaultGasPrice(network),
      network,
      nonce: (await signingClient.getSequence(accs[0].address)).sequence - 1,
      to,
      transactionHash: broadcastTxResponse.transactionHash,
      transactionLink: getTransactionLink(
        broadcastTxResponse.transactionHash,
        network,
      ),
    },
  };
}

function getMsgSend(message: any, network = 'osmosis'): MsgSend {
  let msgSend = {} as MsgSend;
  try {
    // check if a proto-encoded message
    const encodeObj: EncodeObject = message as unknown as EncodeObject;
    // check if it a MsgSend
    if (isMsgSendEncodeObject(encodeObj)) {
      msgSend = new Registry().decode(encodeObj as DecodeObject);
    }
  } catch (error) {
    try {
      // otherwise, check if it is an amino-encoded message
      const aminoMsg: AminoMsg = message as unknown as AminoMsg;
      // check if it a MsgSend
      if (isAminoMsgSend(aminoMsg)) {
        const encodeObj = new AminoTypes({
          prefix: getNetwork(network).bech32Prefix,
        }).fromAmino(aminoMsg);
        if (isMsgSendEncodeObject(encodeObj)) {
          msgSend = new Registry().decode(encodeObj as DecodeObject);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  return msgSend;
}

export = {
  getTransactionLink,
  getWalletLink,
  getTransaction,
  isValidWalletAddress,
  sendTransaction,
  getBalance,
};
