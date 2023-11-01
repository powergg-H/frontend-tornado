
/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-09 20:02:11
 * @LastEditTime : 2023-08-19 15:43:30
 * @FilePath     : tronLink.js
 */
import { bigInt, toHex, fromDecimals } from "@/utils";
import MerkleTree from "fixed-merkle-tree";
import currentInfo from "@/utils/config_index"
import i18next from "i18next";
import circomlib from "@/circomlib";
import axios from "axios"
import { BN, toBN } from "web3-utils"
let circuit = require('@/circuits/withdraw.json')
const TronWeb = require("tronweb")
const assert = require("assert");
const websnarkUtils = require("@/websnark/src/utils");
const pedersenHash = (data) =>
  circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
let groth16 = undefined;
let tronWeb_node = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  headers: { "TRON-PRO-API-KEY": "74886d22-9317-47f4-92c5-f72e9bf661eb" },
})
const MERKLE_TREE_HEIGHT = 20;
export async function withdrawTronLink({ noteString, recipient, relay, refund = 0, build16 }) {
  currentInfo.setWithdrawStatus(0)
  let contract
  let rewardAccount, fee = 0;
  let relayerURL = ""
  groth16 = build16;
  //代币类型改为由凭据判断
  const [currency, amount] = getDepositType(noteString);

  if (!currency || !amount || (currency !== "trx" && currency !== "usdt")) {
    throw new Error(i18next.t("fail2"))
  }
  const tronWeb = window.tronWeb;
  const netId = currentInfo.netId
  currentInfo.setWithdrawStatus(1)
  const instanceAddress = currentInfo.configJson[`netId${netId}`][currency].instanceAddress[amount]
  if (currency === 'trx') {
    let trxInstanceJson = require('@/contracts_trx/TornadoCash_Eth_01.json')
    contract = await tronWeb.contract(trxInstanceJson.abi, instanceAddress)
  } else {
    let TRC20InstanceJson = require('@/contracts_trx/TornadoCash_erc20.json')
    contract = await tronWeb.contract(TRC20InstanceJson.abi, instanceAddress)
  }

  if (relay.address) { //使用了relay方式;


    currentInfo.setWithdrawStatus(2)
    relayerURL = relay.address;
    const { data, status } = await axios.get(relayerURL + '/status/tron');
    if (status !== 200) return console.error("没获取到relay相关信息")
    const { trxPrices: { fees, priceTokens }, tornadoServiceFee } = data;
    rewardAccount = data.rewardAccount;

    const { tron: { energyPrice: gasPrice, changeLimit, withdrawEnergy: withdrawLimt } } = fees;
    const result = priceTokens['tron'].find(({ name }) => name.toLocaleLowerCase() === currency)
    if (!result && currency !== "trx") throw new Error(i18next.t("fail2"))

    if (!currentInfo.configJson[`netId${netId}`] || !currentInfo.configJson[`netId${netId}`][currency]) {
      console.log("error current || netid undefined")
    }
    const decimals = currentInfo.configJson[`netId${netId}`][currency].decimals
    const decimalsPoint = Math.floor(tornadoServiceFee) === Number(tornadoServiceFee) ?
      0 :
      tornadoServiceFee.toString().split('.')[1].length

    // const roundDecimal = 10 ** decimalsPoint
    // const total = toBN(fromDecimals({ amount, decimals }))
    fee = calculateFee({
      withdrawLimt,
      currency,
      gasPrice,
      amount,
      refund,
      ethPrices: result ? result.price : 0,
      relayerServiceFee: tornadoServiceFee,
      decimals
    });
    // let percentFee = total.mul(toBN(tornadoServiceFee * roundDecimal)).div(toBN(roundDecimal * 100))
    // fee = percentFee
    // if (fee.gt(fromDecimals({ amount, decimals }))) {
    //   throw new Error('Too high refund');
    // };
  }
  let deposit = parseNoteTronLink(noteString)
  recipient = tronWeb.address.toHex(recipient)
  currentInfo.setWithdrawStatus(4)
  let { proof, args } = await generateSnarkProof({ deposit, contract, amount, recipient, relayerAddress: rewardAccount, fee, refund })
  console.log('Submitting withdraw transaction')
  if (relay.address) {//使用了relay方式
    currentInfo.setWithdrawStatus(5)
    const response = await axios.post(relayerURL + '/tornadoWithdraw', {
      chainName: "tron",
      contract: instanceAddress,
      proof,
      args,
      inviteCode: getInitCode() || ""
    })
    const { id } = response.data;
    return await getStatus(id, relayerURL);
  } else {
    currentInfo.setWithdrawStatus(8)
    return await contract.withdraw(proof, ...args).send()
  }
}

function calculateFee({ withdrawLimt, currency, gasPrice, amount, refund, ethPrices, relayerServiceFee, decimals }) {
  console.log(arguments, "arg")
  const decimalsPoint =
    Math.floor(relayerServiceFee) === Number(relayerServiceFee) ? 0 : relayerServiceFee.toString().split('.')[1].length;
  const roundDecimal = 10 ** decimalsPoint;
  const total = toBN(fromDecimals({ amount, decimals }));
  const feePercent = total.mul(toBN(relayerServiceFee * roundDecimal)).div(toBN(roundDecimal * 100));
  const expense = toBN(fromDecimals({ amount: gasPrice * 1.2, decimals: 6 })).mul(toBN(withdrawLimt));
  let desiredFee;
  switch (currency) {
    case 'trx': {
      desiredFee = expense.add(feePercent);
      break;
    }
    default: {
      desiredFee = expense
        .add(toBN(refund))
        .mul(toBN(10 ** decimals))
        .div(toBN(fromDecimals({ amount: ethPrices, decimals: 6 })))
      desiredFee = desiredFee.add(feePercent);
      break;
    }
  }
  return desiredFee;
}
async function generateSnarkProof({ deposit, contract, recipient, relayerAddress, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment

  const { root, pathElements, pathIndices } = await generateMerkleProof(deposit, contract)

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt('0x' + recipient.substring(2)),
    relayer: relayerAddress || 0,
    fee,
    refund,
    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: pathElements,
    pathIndices: pathIndices,
  }

  console.log('Generating SNARK proof')
  const proving_key = await fetch('withdraw_proving_key.bin').then(res => res.arrayBuffer())
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  const { proof } = websnarkUtils.toSolidityInput(proofData)
  console.log(input.relayer, "relayerAddress")
  console.log(toHex(input.relayer, 20), " toHex(input.relayer, 20)")
  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund),
  ]

  return { proof, args }
}


async function generateMerkleProof(deposit, contract) {
  // Get all deposit events from smart contract and assemble merkle tree from them


  const events = await tronWeb_node.getEventResult(contract.address, { eventName: 'Deposit', size: 1000000 })
  const leaves = events
    .sort((a, b) => a.result.leafIndex - b.result.leafIndex) // Sort events in chronological order
    .map(e => '0x' + e.result.commitment)
  const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves)

  // Find current commitment in the tree
  const depositEvent = events.find(e => '0x' + e.result.commitment === toHex(deposit.commitment))
  const leafIndex = depositEvent ? depositEvent.result.leafIndex : -1

  // Validate that our data is correct
  const root = tree.root()
  const isValidRoot = await contract.isKnownRoot(toHex(root)).call()
  const isSpent = await contract.isSpent(toHex(deposit.nullifierHash)).call()
  assert(isValidRoot === true, i18next.t("iscorrupted"))
  assert(isSpent === false, i18next.t("isSpent"))
  assert(leafIndex >= 0, i18next.t("fail2"))

  // Compute merkle proof of our commitment
  const { pathElements, pathIndices } = tree.path(leafIndex)
  return { pathElements, pathIndices, root: tree.root() }
}

function parseNoteTronLink(noteString) {
  currentInfo.setWithdrawStatus(3)
  const noteRegex = /vortextrx-(?<currency>\w+)-(?<amount>[\d.]+)-0x(?<netId>[0-9a-fA-F]{1,10})-0x(?<note>[0-9a-fA-F]{124})/g
  const match = noteRegex.exec(noteString)
  // we are ignoring `currency`, `amount`, and `netId` for this minimal example
  const buf = Buffer.from(match.groups.note, 'hex')
  const nullifier = bigInt.leBuff2int(buf.slice(0, 31))
  const secret = bigInt.leBuff2int(buf.slice(31, 62))
  return createDeposit({ nullifier, secret })
}
function createDeposit({ nullifier, secret }) {
  const deposit = { nullifier, secret }
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(deposit.preimage)
  deposit.commitmentHex = toHex(deposit.commitment)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
  deposit.nullifierHex = toHex(deposit.nullifierHash)
  return deposit
}

function getStatus(id, relayerURL) {
  return new Promise((resolve, reject) => {
    async function getRelayerStatus() {
      const responseStatus = await axios.get(relayerURL + '/jobs/' + id,);
      if (responseStatus.status === 200) {
        const { txHash, status, confirmations, failedReason } = responseStatus.data

        console.log(`Current job status ${status}, confirmations: ${confirmations}`);

        if (status === 'FAILED') {
          reject(status + ' failed reason:' + failedReason);
          return

        }

        if (status === 'CONFIRMED') {
          resolve(status);
          return
        }
      }
      const timer = setTimeout(() => {
        getRelayerStatus(id, relayerURL);
        clearTimeout(timer)
      }, 2000)
    }

    getRelayerStatus();
  })
}
/**
* 
* @param {string } noteString 凭据
* @returns {array} [代币类型,数量]
*/

function getDepositType(noteString) {
  if (noteString.indexOf) {
    const [_, currency, amount] = noteString.split("-");
    return [currency, amount]

  }
}

function getInitCode() {
  let code = window.location.search.slice(1);
  if (code) {
    code = code.split("&")[0]
  }
  if (code.includes("tronlink")) {
    code = ""
  }
  return code
}