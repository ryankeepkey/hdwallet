import { ExchangeType, BIP32Path } from './wallet'

export interface ETHGetAccountPath {
  coin: string,
  accountIdx: number
}

/** 
 * Concat accountPath with relPath for the absolute path to the Ethereum address.
 */
export interface ETHAccountPath {
  addressNList: BIP32Path,
  hardenedPath: BIP32Path,
  relPath: BIP32Path,
  description: string,
}

export interface ETHAccountSuffix {
  addressNList: BIP32Path
}

export interface ETHGetAddress {
  addressNList: BIP32Path,
  showDisplay?: boolean,
  /** Optional. Required for showDisplay == true. */
  address?: string,
}

export interface ETHSignTx {
  /** bip32 path to sign the transaction from */
  addressNList: BIP32Path,
  /** big-endian hex, prefixed with '0x' */
  nonce: string,
  /** big-endian hex, prefixed with '0x' */
  gasPrice: string,
  /** big-endian hex, prefixed with '0x' */
  gasLimit: string,
  /** address, with '0x' prefix */
  to: string,
  /** bip32 path for destination (device must `ethSupportsSecureTransfer()`) */
  toAddressNList?: BIP32Path,
  /** big-endian hex, prefixed with '0x' */
  value: string,
  /** prefixed with '0x' */
  data: string,
  /** mainnet: 1, ropsten: 3, kovan: 42 */
  chainId: number,
  /**
   * Device must `ethSupportsNativeShapeShift()`
   */
  exchangeType?: ExchangeType
}

export interface ETHSignedTx {
  /** uint32 */
  v: number,
  /** big-endian hex, prefixed with '0x' */
  r: string,
  /** big-endian hex, prefixed with '0x' */
  s: string,
  /** big-endian hex, prefixed with '0x' */
  serialized: string
}

export interface ETHSignMessage {
  addressNList: BIP32Path,
  message: string
}

export interface ETHSignedMessage {
  address: string,
  signature: string
}

export interface ETHVerifyMessage {
  address: string,
  message: string,
  signature: string
}

export interface ETHWalletInfo {
  _supportsETHInfo: boolean

  /**
   * Does the device support the Ethereum network with the given chain_id?
   */
  ethSupportsNetwork (chain_id: number): Promise<boolean>

  /**
   * Does the device support internal transfers without the user needing to
   * confirm the destination address?
   */
  ethSupportsSecureTransfer (): Promise<boolean>

  /**
   * Does the device support `/sendamountProto2` style ShapeShift trades?
   */
  ethSupportsNativeShapeShift (): Promise<boolean>

  /**
   * Returns a list of bip32 paths for a given account index in preferred order
   * from most to least preferred.
   *
   * Note that this is the location of the ETH address in the tree, not the
   * location of its corresponding xpub.
   */
  ethGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath>

  /**
   * Returns the "next" ETH account, if any.
   */
  ethNextAccountPath (msg: ETHAccountPath): ETHAccountPath | undefined
}

export interface ETHWallet extends ETHWalletInfo {
  _supportsETH: boolean

  ethGetAddress (msg: ETHGetAddress): Promise<string>
  ethSignTx (msg: ETHSignTx): Promise<ETHSignedTx>
  ethSignMessage (msg: ETHSignMessage): Promise<ETHSignedMessage>
  ethVerifyMessage (msg: ETHVerifyMessage): Promise<boolean>
}