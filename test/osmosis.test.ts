import osmosisLib from '../src/index'
import {expect, assert} from 'chai'
import 'mocha'
import * as dotenv from "dotenv"
console.log(`${__dirname}/.env`)
dotenv.config({path: `${__dirname}/.env`})

// variables
const mainTimeout = 14000;
const testData = {
    toWalletAddress:  process.env.TOWALLETADDRESS || "",
    network:  process.env.NETWORK || "",
    mnemonic: process.env.MNEMONIC || "",
    crypto: 'OSMO',
    denom: 'uosmo',
    amount: 0.000005,
    decimals: 6 
};

const runtime = {transactionHash: '', transactionLink: ''};


const keys = {
    sendTransaction: [
        "amount",
        "date",
        "from",
        "gasCostCryptoCurrency",
        "gasCostInCrypto",
        "gasLimit",
        "gasPrice",
        "network",
        "nonce",
        "to",
        "transactionHash",
        "transactionLink"
    ],
    getTransaction : [
        "amount",
        "date",
        "from",
        "gasCostCryptoCurrency",
        "gasCostInCrypto",
        "gasLimit",
        "gasPrice",
        "isPending",
        "isExecuted",
        "isSuccessful",
        "isFailed",
        "isInvalid",
        "network",
        "nonce",
        "to",
        "transactionHash",
        "transactionLink"
    ]
};


describe("osmosis-mainet module", () => {

    it("should getBalance", async function () {
        this.timeout(mainTimeout * 3);
        const result = await osmosisLib.getBalance(testData.toWalletAddress, testData.network, testData.denom, testData.decimals);
        console.log(result)
        expect(typeof result === "number");
    });

    it("should isValidWalletAddress", async function () {
        this.timeout(mainTimeout * 3);
        const result = await osmosisLib.isValidWalletAddress(testData.toWalletAddress);
        expect(result === true);
    });

    it("should sendTransaction", async function () {
        this.timeout(mainTimeout * 3);
        const {
            toWalletAddress: to,
            mnemonic,
            network,
            amount,
            denom,
            decimals
        } = testData;

        const result = await osmosisLib.sendTransaction({
            to,
            amount,
            network,
            mnemonic,
            denom,
            decimals
        });
        console.log(result)
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHash = result.receipt.transactionHash;
    });

    it("should getTransaction", async function () {
        this.timeout(mainTimeout * 3);
        const {
            network,
        } = testData;
        const result = await osmosisLib.getTransaction(runtime.transactionHash, network);
        console.log(result)
        if (result) assert.hasAllKeys(result.receipt, keys.getTransaction);
    });
});