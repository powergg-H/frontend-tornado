import { bigInt, toHex, getIspc, fromDecimals } from "@/utils";
import circomlib from "@/circomlib";
import erc20ContractJson from "@/contracts/USDT.sol/ERC20Token.json"
import currentInfo, { SCHEMEURL } from "@/utils/config_index"
import { BN, toBN } from "web3-utils"
import crypto from "crypto"
import Web3 from "web3"
const BigNumber = require('bignumber.js');

let erc20TokenAddress, erc20
/** Generate random number of specified byte length */
export let rbigint = (nbytes) =>
  bigInt.leBuff2int(crypto.randomBytes(nbytes));

/** Compute pedersen hash */
const pedersenHash = (data) =>
  circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];



/**
 * Create deposit object from secret and nullifier
 */
export function createDeposit({ nullifier, secret }) {

  let deposit = { nullifier, secret };
  deposit.preimage = Buffer.concat([
    deposit.nullifier.leInt2Buff(31),
    deposit.secret.leInt2Buff(31),
  ]);
  deposit.commitment = pedersenHash(deposit.preimage)
  deposit.commitmentHex = toHex(deposit.commitment)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
  deposit.nullifierHex = toHex(deposit.nullifierHash)
  return deposit;
}

/**
 * create a deposit invoice.
 * @param currency Сurrency
 * @param amount Deposit amount
 */
export async function createInvoice({ currency, amount, chainId }) {
  const deposit = createDeposit({
    nullifier: rbigint(31),
    secret: rbigint(31),
  });
  const note = toHex(deposit.preimage, 62);
  const noteString = `vortex-${currency}-${amount}-${chainId}-${note}`
  console.log(`Your note: ${noteString}`);
  // const commitmentNote = toHex(deposit.commitment);
  // const invoiceString = `tornadoInvoice-${currency}-${amount}-${chainId}-${commitmentNote}`;
  return { noteString, chainId, deposit };
}
//metamask
export const startDepositMetamask = async ({ amount, account, currency }) => {
  const netId = currentInfo.netId;
  const depositResult = await createInvoice({
    currency,
    amount,
    chainId: netId,
  });

  const instanceAddress = currentInfo.configJson[`netId${netId}`][currency].instanceAddress[amount]
  const instanceName = currency + '-' + amount
  const data = {
    ...depositResult,
    account,
    instanceAddress,
    amount,
    currency,
    instanceName
  }
  switch (currency) {
    case "eth":
      return getDepositETH(data)
    case "usdt":
      return getDepositUSDT(data)
  }
}

export const startDepositTronLink = async ({ currency, amount, account }) => {
  /** Generate random number of specified byte length */
  const netId = currentInfo.netId;
  const deposit = createDeposit({
    nullifier: rbigint(31),
    secret: rbigint(31),
  })
  const note = toHex(deposit.preimage, 62)
  const noteString = `vortextrx-${currency}-${amount}-${netId}-${note}`

  console.log(`Your note: ${noteString}`)
  let instanceName = currency + '-' + amount
  const instanceAddress = currentInfo.configJson[`netId${netId}`][currency].instanceAddress[amount]

  if (currency === 'trx') {
    const value = fromDecimals({ amount, decimals: 6 })
    console.log('Submitting deposit transaction')

    const trxInstanceJson = require('@/contracts_trx/TornadoCash_Eth_01.json')

    const contract = await tronWeb.contract(trxInstanceJson.abi, instanceAddress)
    // await printTRXBalance({ address: instanceAddress, name: instanceName })
    // await printTRXBalance({ address: account, name: 'Sender account' })

    const tx = await waitTooLen(contract.deposit(toHex(deposit.commitment))
      .send({ callValue: value, feeLimit: 1e9 }))

    console.log(`View transaction on etherscan https://nile.tronscan.org/#/transaction/${tx}`)

  } else { // a token
    //初始化对应的TRC20 Instance合约
    let TRC20InstanceJson = require('@/contracts_trx/TornadoCash_erc20.json')
    let contract = await tronWeb.contract(TRC20InstanceJson.abi, instanceAddress)
    erc20TokenAddress = currentInfo.configJson[`netId${netId}`][currency].tokenAddress

    erc20 = await tronWeb.contract(erc20ContractJson.abi, erc20TokenAddress)
    const decimals = currentInfo.configJson[`netId${netId}`][currency].decimals

    await printTRC20Balance({ address: instanceAddress, name: instanceName, decimals: decimals })
    await printTRC20Balance({ address: account, name: 'Sender account', decimals: decimals })
    const tokenAmount = fromDecimals({ amount, decimals })

    let allowance = await erc20.allowance(account, instanceAddress).call()
    let currentAllowance = new BigNumber(allowance._hex).div(new BigNumber(10).pow(decimals))

    console.log('Current allowance is', currentAllowance.toString())
    if (toBN(allowance._hex).lt(toBN(tokenAmount))) {
      console.log('Approving tokens for deposit')
      await erc20.approve(instanceAddress, tokenAmount.toString()).send({ callValue: 0, feeLimit: 1e9 })
    }

    console.log('Submitting deposit transaction')
    let commitment = toHex(deposit.commitment)
    console.log('commitment: ', commitment)
    let tx = await waitTooLen(contract.deposit(commitment).send({ callValue: 0, feeLimit: 1e9 }))
    console.log(`View transaction on etherscan https://nile.tronscan.org/#/transaction/${tx}`)
  }
  return noteString
}



const getDepositETH = async (data) => {
  const { amount, account, deposit, chainId: netId, instanceAddress, noteString } = data;
  const web3 = window.web3;
 
  const contractJson = require("@/contracts/TornadoCash_Eth_01.sol/TornadoCash_Eth_01.json");
  const { commitment } = deposit;
  const contract = new web3.eth.Contract(contractJson.abi, instanceAddress);
  let tx;
  //WalletConnect向下兼容方法  
  if (currentInfo.currentWalltType === "WalletConnect") {
    const datas = await contract.methods.deposit(toHex(commitment)).encodeABI()
    if (!getIspc) { window.location.href = SCHEMEURL[currentInfo.currentWalltType] }
    const nonce = await web3.eth.getTransactionCount(account, "pending")
    tx = await waitTooLen(currentInfo.providers.request({
      method: "eth_sendTransaction",
      params: [
        {
          data: datas,
          from: account,
          to: contract._address,
          gas: toHex(2000000),
          value: toHex(amount * Math.pow(10, 18)),
        }
      ]
    }))
  } else {
    tx = await contract.methods.deposit(toHex(commitment)).send({
      value: web3.utils.toWei(amount, "ether"),
      from: account,
      // nonce: toHex(nonce)
    });
  }
  console.log(tx, "tx")
  console.log(`https://sepolia.etherscan.io/tx/${tx.transactionHash}`);
  return noteString

};
const getDepositUSDT = async (data) => {
  const { amount, account, deposit, chainId: netId, instanceAddress, currency, noteString, instanceName } = data;
  const web3 = window.web3;

  const contractJson = require('@/contracts/TornadoCash_erc20.sol/TornadoCash_erc20.json')
  //初始化对应的ERC20合约
  const contract = new web3.eth.Contract(contractJson.abi, instanceAddress);
  const erc20TokenAddress = currentInfo.configJson[`netId${netId}`][currency].tokenAddress

  const erc20 = new web3.eth.Contract(erc20ContractJson.abi, erc20TokenAddress)
  const decimals = currentInfo.configJson[`netId${netId}`][currency].decimals
  // await printERC20Balance({ address: instanceAddress, name: instanceName, decimals: decimals, erc20 })
  // await printERC20Balance({ address: account, name: 'Sender account', decimals: decimals, erc20 })
  const tokenAmount = fromDecimals({ amount, decimals })
  const allowance = await erc20.methods.allowance(account, instanceAddress).call({ from: account })
  const nonce = await web3.eth.getTransactionCount(account, "pending")
  if (toBN(String(Number(allowance))).lt(toBN(tokenAmount))) {
    await erc20.methods.approve(instanceAddress, toHex(tokenAmount)).send({ from: account, gas: 1e6, nonce })
  }
  if (currentInfo.currentWalltType === "WalletConnect") {
   
    const datas = contract.methods.deposit(toHex(deposit.commitment)).encodeABI()
    await waitTooLen(currentInfo.providers.request({
      method: "eth_sendTransaction",
      params: [
        {
          data: datas,
          from: account,
          to: contract._address,
          // gas: toHex(1000000),
          // value: toHex(amount * Math.pow(10, 18)),
          nonce: toHex(nonce)
        }
      ]
    }))
  } else {
    await contract.methods.deposit(toHex(deposit.commitment)).send({ from: account, gas: 2e6 })
    // await printERC20Balance({address: instanceAddress, name: instanceName, decimals:decimals})
    // await printERC20Balance({address: senderAccount, name: 'Sender account', decimals:decimals})
  }
  return noteString
}
async function printERC20Balance({ address, name, decimals, erc20 }) {
  let balance = await erc20.methods.balanceOf(address).call()
  balance = new BigNumber(balance).dividedBy(new BigNumber(10).pow(decimals));
  console.log(`${name} Token Balance is`, balance.toString())
}
async function printTRXBalance({ address, name }) {
  console.log(`${name} TRX balance is`, tronWeb.fromSun(await tronWeb.trx.getBalance(address)))
}

async function printTRC20Balance({ address, name, decimals }) {
  let balance = await erc20.balanceOf(address).call()
  balance = new BigNumber(balance._hex).dividedBy(new BigNumber(10).pow(decimals));
  console.log(`${name} Token Balance is`, balance.toString())
}




function waitTooLen(p) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve("pendding")
    }, 20000)
    p.then(res => {
      clearTimeout(timer)
      resolve(res)
    }).catch(err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}