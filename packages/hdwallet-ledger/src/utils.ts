import { crypto } from "bitcoinjs-lib"
import bs58 from "bs58"
import { padStart } from "lodash"
import {
  BTCInputScriptType,
  WrongApp,
  SelectApp,
  ActionCancelled,
  makeEvent,
} from '@shapeshiftoss/hdwallet-core'
import { LedgerTransport } from './transport'
import { Buffer } from "buffer";

export function handleError (transport: LedgerTransport, result: any, message: string): void {
  if (result.success)
    return

  if (result.payload && result.payload.error) {

    // No app selected
    if (result.payload.error.includes('0x6700') ||
        result.payload.error.includes('0x6982')) {
      throw new SelectApp('Ledger', result.coin)
    }

    // Wrong app selected
    if (result.payload.error.includes('0x6d00')) {
      throw new WrongApp('Ledger', result.coin)
    }

    // User selected x instead of ✓
    if (result.payload.error.includes('0x6985')) {
      throw new ActionCancelled()
    }

    transport.emit(`ledger.${result.coin}.${result.method}.call`, makeEvent({
      message_type: 'ERROR',
      from_wallet: true,
      message
    }))

    throw new Error(`${message}: '${result.payload.error}'`)
  }
}

export const getderivationModeFromFormat = (format:string):string => {
  let derivationMode
  switch (format) {
    case "bech32":
      derivationMode = "segwit"
      break;
    default:
      derivationMode = ""
  }
  return derivationMode
}

export const translateScriptType = (scriptType: BTCInputScriptType): string => ({
  [BTCInputScriptType.SpendAddress]: 'legacy',
  [BTCInputScriptType.CashAddr]: 'legacy',
  [BTCInputScriptType.SpendWitness]: 'bech32',
  [BTCInputScriptType.SpendP2SHWitness]: 'p2sh'
}[scriptType])

const toHexDigit = (number) => {
  const digits = "0123456789abcdef"
  return digits.charAt(number >> 4) + digits.charAt(number & 0x0f)
}

export const compressPublicKey = (publicKey) => {
  let compressedKeyIndex
  if (publicKey.substring(0, 2) !== "04") {
    throw "Invalid public key format"
  }
  if (parseInt(publicKey.substring(128, 130), 16) % 2 !== 0) {
    compressedKeyIndex = "03"
  } else {
    compressedKeyIndex = "02"
  }
  return compressedKeyIndex + publicKey.substring(2, 66)
}

export const parseHexString = (str) => {
  var result = []
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16))
    str = str.substring(2, str.length)
  }
  return result
}

export const encodeBase58Check = (vchIn)  => {
  vchIn = parseHexString(vchIn)
  var chksum = crypto.sha256(vchIn)
  chksum = crypto.sha256(chksum)
  chksum = chksum.slice(0, 4)
  var hash = vchIn.concat(Array.from(chksum))
  return bs58.encode(Buffer.from(hash))
}

export const createXpub = (
  depth,
  fingerprint,
  childnum,
  chaincode,
  publicKey,
  network
) => {
  var xpub = toHexInt(network);
  xpub = xpub + padStart(depth.toString(16), 2, "0");
  xpub = xpub + padStart(fingerprint.toString(16), 8, "0");
  xpub = xpub + padStart(childnum.toString(16), 8, "0");
  xpub = xpub + chaincode;
  xpub = xpub + publicKey;
  return xpub;
}

const toHexInt = (number) => (
  toHexDigit((number >> 24) & 0xff) +
  toHexDigit((number >> 16) & 0xff) +
  toHexDigit((number >> 8) & 0xff) +
  toHexDigit(number & 0xff)
)

export const networksUtil = {
  0: {
    apiName: "btc",
    unit: "BTC",
    name: "bitcoin",
    satoshi: 8,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 76066276,
        public: 76067358
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 0,
      scriptHash: 5,
      wif: 128
    },
    isSegwitSupported: true,
    handleFeePerByte: true
  },
  1: {
    apiName: "btc_testnet",
    unit: "BTC",
    name: "btc testnet",
    satoshi: 8,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 70615956,
        public: 70617039
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 111,
      scriptHash: 196,
      wif: 239
    },
    isSegwitSupported: true,
    handleFeePerByte: true
  },
  2: {
    name: "litecoin",
    unit: "LTC",
    apiName: "ltc",
    isSegwitSupported: true,
    satoshi: 8,
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 0x019d9cfe,
        public: 0x019da462
      },
      messagePrefix: "Litecoin Signed Message:",
      pubKeyHash: 48,
      scriptHash: 50,
      wif: 0xb0
    },
    handleFeePerByte: false
  },
  145: {
    name: "bitcoin cash",
    apiName: "abc",
    satoshi: 8,
    unit: "BCH",
    bitcoinjs: {
      bech32: "bc",
      bip32: {
        private: 76066276,
        public: 76067358
      },
      messagePrefix: "Bitcoin Signed Message:",
      pubKeyHash: 0,
      scriptHash: 5,
      wif: 128
    },
    sigHash: 0x41,
    isSegwitSupported: true,
    handleFeePerByte: true,
    additionals: ["abc"]
  },
  128: {
    apiName: "vtc",
    unit: "VTC",
    satoshi: 8,
    name: "Vertcoin",
    bitcoinjs: {
      bip32: {
        public: 0x0488b21e,
        private: 0x05358394
      },
      messagePrefix: "Vertcoin Signed Message:",
      pubKeyHash: 71,
      scriptHash: 5,
      wif: 128
    },
    isSegwitSupported: true,
    handleFeePerByte: false
  },
  5: {
    name: "dash",
    satoshi: 8,
    unit: "DASH",
    apiName: "dash",
    bitcoinjs: {
      messagePrefix: "DarkCoin Signed Message:",
      bip32: { public: 50221816, private: 87393172 },
      pubKeyHash: 76,
      scriptHash: 16,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: undefined
  },
  6: {
    name: "peercoin",
    satoshi: 6,
    unit: "PPC",
    apiName: "ppc",
    bitcoinjs: {
      messagePrefix: "PPCoin Signed Message:",
      bip32: { public: 3874023909, private: 87393172 },
      pubKeyHash: 55,
      scriptHash: 117,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  14: {
    name: "viacoin",
    satoshi: 8,
    unit: "VIA",
    apiName: "via",
    bitcoinjs: {
      messagePrefix: "Viacoin Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 71,
      scriptHash: 33,
      wif: 128
    },
    isSegwitSupported: true,
    handleFeePerByte: false,
    areTransactionTimestamped: false
  },
  20: {
    name: "digibyte",
    satoshi: 8,
    unit: "DGB",
    apiName: "dgb",
    bitcoinjs: {
      messagePrefix: "DigiByte Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 30,
      scriptHash: 5,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: false
  },
  47: {
    name: "poswallet",
    satoshi: 8,
    unit: "POSW",
    apiName: "posw",
    bitcoinjs: {
      messagePrefix: "PoSWallet Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 55,
      scriptHash: 85,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  60: {
    apiName: "eth",
    unit: "ETH",
    name: "ethereum",
    bitcoinjs: {
      bip32: {
        public: 76067358
      },
      messagePrefix: "Ethereum Signed Message:"
    }
  },
  77: {
    name: "pivx",
    satoshi: 8,
    unit: "PIV",
    apiName: "pivx",
    bitcoinjs: {
      messagePrefix: "DarkNet Signed Message:",
      bip32: { public: 36513075, private: 87393172 },
      pubKeyHash: 30,
      scriptHash: 13,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: false
  },
  79: {
    name: "clubcoin",
    satoshi: 8,
    unit: "CLUB",
    apiName: "club",
    bitcoinjs: {
      messagePrefix: "ClubCoin Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 28,
      scriptHash: 85,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  88: {
    name: "qtum",
    satoshi: 8,
    unit: "QTUM",
    apiName: "qtum",
    bitcoinjs: {
      messagePrefix: "Qtum Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 58,
      scriptHash: 50,
      wif: 128
    },
    isSegwitSupported: true,
    handleFeePerByte: false,
    areTransactionTimestamped: undefined
  },
  105: {
    name: "stratis",
    satoshi: 8,
    unit: "STRAT",
    apiName: "strat",
    bitcoinjs: {
      messagePrefix: "Stratis Signed Message:",
      bip32: { public: 76071454, private: 87393172 },
      pubKeyHash: 63,
      scriptHash: 125,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  125: {
    name: "stealthcoin",
    satoshi: 6,
    unit: "XST",
    apiName: "xst",
    bitcoinjs: {
      messagePrefix: "StealthCoin Signed Message:",
      bip32: { public: 2405583718, private: 87393172 },
      pubKeyHash: 62,
      scriptHash: 85,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  //133: {
  //  name: "zcash",
  //  satoshi: 8,
  //  unit: "ZEC",
  //  apiName: "zec",
  //  bitcoinjs: {
  //    messagePrefix: "Zcash Signed Message:",
  //    bip32: { public: 76067358, private: 87393172 },
  //    pubKeyHash: 7352,
  //    scriptHash: 7357,
  //    wif: 128
  //  },
  //  isSegwitSupported: false,
  //  handleFeePerByte: false,
  //  areTransactionTimestamped: undefined,
  //  expiryHeight: Buffer.from("00000000", "hex")
  //},
  141: {
    name: "komodo",
    satoshi: 8,
    unit: "KMD",
    apiName: "kmd",
    bitcoinjs: {
      messagePrefix: "Komodo Signed Message:",
      bip32: { public: 4193182861, private: 87393172 },
      pubKeyHash: 60,
      scriptHash: 85,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: undefined
  },
  156: {
    name: "bitcoin gold",
    satoshi: 8,
    unit: "BTG",
    apiName: "btg",
    bitcoinjs: {
      messagePrefix: "Bitcoin gold Signed Message:",
      bip32: { public: 76067358, private: 76066276 },
      pubKeyHash: 38,
      scriptHash: 23,
      wif: 128
    },
    sigHash: 0x41,
    isSegwitSupported: true,
    handleFeePerByte: true,
    areTransactionTimestamped: undefined,
    additionals: ["gold"]
  },
  171: {
    name: "hcash",
    satoshi: 8,
    unit: "HSR",
    apiName: "hsr",
    bitcoinjs: {
      messagePrefix: "HShare Signed Message:",
      bip32: { public: 76071454, private: 87393172 },
      pubKeyHash: 40,
      scriptHash: 100,
      wif: 128
    },
    isSegwitSupported: false,
    handleFeePerByte: false,
    areTransactionTimestamped: true
  },
  121: {
    name: "zencash",
    satoshi: 8,
    unit: "ZEN",
    apiName: "zen",
    bitcoinjs: {
      messagePrefix: "Zencash Signed Message:",
      bip32: { public: 76067358, private: 87393172 },
      pubKeyHash: 0x2089,
      scriptHash: 0x2096,
      wif: 128
    }
  },
  3: {
    name: "dogecoin",
    satoshi: 8,
    unit: "Ð",
    apiName: "doge",
    bitcoinjs: {
      messagePrefix: "Dogecoin Signed Message:",
      bip32: { public: 0x02facafd, private: 87393172 },
      pubKeyHash: 30,
      scriptHash: 22,
      wif: 128
    }
  }
}
