import { bigInt, toHex, getIspc, fromDecimals } from "@/utils";
import MerkleTree from "fixed-merkle-tree";
import websnark from "@/websnark";
import currentInfo, { SCHEMEURL } from "@/utils/config_index"
const assert = require("assert");
import { BN, toBN } from "web3-utils"
const websnarkUtils = require("@/websnark/src/utils");
import { createDeposit } from "../deposit";
const { GasPriceOracle } = require('gas-price-oracle');
import {relayUrl} from "@/service/config"
import {getResultStatus} from "@/Api/index"
import axios from "axios"
import i18next from "i18next";
import { Toast } from "antd-mobile";
let count = 0;
let contract = null,
  groth16 = undefined;
const MERKLE_TREE_HEIGHT = 20;

const connectContract = async (currency, amount) => {
  currentInfo.setWithdrawStatus(1)
  const netId = currentInfo.netId
  const web3 = window.web3;
  let contractJson;

  switch (currency) {

    case "eth":
      contractJson = require("@/contracts/TornadoCash_Eth_01.sol/TornadoCash_Eth_01.json");
      break;
    case "usdt":
      contractJson = require("@/contracts/TornadoCash_erc20.sol/TornadoCash_erc20.json");
      break;
  }
  if (!contractJson) {
    console.log("不支持的代币种类")
    return
  }

  const address = currentInfo.configJson[`netId${netId}`][currency].instanceAddress[amount]
  const contract = new web3.eth.Contract(contractJson.abi, address);
  return { contract, address };
};

/**
 * Do an ETH withdrawal
 * @param note Note to withdraw
 * @param recipient Recipient address
 */
export async function withdraw({ noteString, recipient, account, relay, refund = 0, build16 }) {
  currentInfo.setWithdrawStatus(0)
  let rewardAccount, fee = 0;
  let relayerURL = ""

  // groth16 = await websnark.buildGroth16();
  groth16 = build16;
  //代币类型改为由凭据判断
  const [currency, amount] = getDepositType(noteString);

  if (!currency || !amount || (currency !== "eth" && currency !== "usdt")) {
    throw new Error(i18next.t("fail2"))
  }
  const deposit = parseNote(noteString);

  const { contract: contracts, address } = await connectContract(currency, amount);
  contract = contracts;

  // const isSpent = await contract.methods.isSpent(toHex(deposit.nullifierHash)).call();

  // if(!isSpent) throw new Error("无效的凭证")
  if (relay.address) { //使用了relay方式;
    relayerURL = relay.address;
    currentInfo.setWithdrawStatus(2)
    const { data, status } = await axios.get(relayerURL + '/status');
    if (status !== 200) return console.error("没获取到relay相关信息")
    const { netId, ethPrices: { fees, priceTokens }, tornadoServiceFee } = data;
    rewardAccount = data.rewardAccount;
    const { eth: { gasPrice, changeLimit, withdrawLimt } } = fees
    const result = priceTokens['eth'].find(({ name }) => name.toLocaleLowerCase() === currency)
    if (!result && currency !== "eth") throw new Error(i18next.t("fail2"))
    if (!currentInfo.configJson[`netId${netId}`] || !currentInfo.configJson[`netId${netId}`][currency]) {
      console.log("error current || netid undefined")
    }
    const decimals = currentInfo.configJson[`netId${netId}`][currency].decimals
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

    if (fee.gt(fromDecimals({ amount, decimals }))) {
      throw new Error('Too high refund');
    };
  }

  let { proof, args } = await generateSnarkProof({ deposit, recipient, relayerAddress: rewardAccount, fee, refund });
  
  
  
  
  if (relay.address) {//使用了relay方式
    currentInfo.setWithdrawStatus(5)
    const response = await axios.post(relayerURL + '/tornadoWithdraw', {
      chainName: "etherum",
      contract: address,
      proof,
      args,
      inviteCode: location.search.slice(1) || ""
    })
    const { id } = response.data;
    return await getStatus(id, relayerURL);
  } else {
    if (currentInfo.currentWalltType === "WalletConnect") {
      const datas = await contract.methods.withdraw(proof, ...args).encodeABI()
    
      currentInfo.setWithdrawStatus(6)
       const hash = await currentInfo.providers.request({
        method: "eth_sendTransaction",
        params: [
        {
          data: datas,
          from: account,
          to: contract._address,
         
        }
      ]
    })
      currentInfo.setWithdrawStatus(7)
      const url=relayUrl
      return getResultStatus({url,txHash:hash,chainName:"eth",netId:currentInfo.netId})
    } else {
      currentInfo.setWithdrawStatus(8)
      return contract.methods
        .withdraw(proof, ...args)
        .send({ from: account, gas: 1e6, gasPrice: 5e9 });
    }

  }

}
// /**
//  * 
//  * @param {string} noteString 合约地址 
//  * @param {string} recipient 收款地址 
//  * @param {string} account  当前连接的地址
//  * @param {("eth") || ("usdc") || ("usdt") || ("trx")} currency  代币类型
//  * @param {number} amount  收款代币数量
//  * @returns {Promise} 调用合约发起收款
//  */

/**
 * Parses Tornado.cash note
 * @param noteString the note
 */
function parseNote(noteString) {

  const noteRegex =
    /vortex-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g;
  const match = noteRegex.exec(noteString);
  console.log(match, "match")
  if (!match) throw new Error(i18next.t("fail2"))
  // we are ignoring `currency`, `amount`, and `netId` for this minimal example
  const buf = Buffer.from(match.groups.note, "hex");
  const nullifier = bigInt.leBuff2int(buf.slice(0, 31));
  const secret = bigInt.leBuff2int(buf.slice(31, 62));

  return createDeposit({ nullifier, secret });
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 */
async function generateSnarkProof({ deposit, recipient, relayerAddress = 0, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment
  const { root, pathElements, pathIndices } = await generateMerkleProof(
    deposit
  );
  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: relayerAddress,
    fee,
    refund,

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: pathElements,
    pathIndices: pathIndices,
  };
  console.log("Generating SNARK proof...");
  currentInfo.setWithdrawStatus(4)
  const proving_key = await (
    await fetch("withdraw_proving_key.bin")
  ).arrayBuffer();
  const circuit = await (await fetch("withdraw.json")).json();
 
  const proofData = await websnarkUtils.genWitnessAndProve(
    groth16,
    input,
    circuit ,
    proving_key
  );
  const { proof } = websnarkUtils.toSolidityInput(proofData);
  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund),
  ];

  return { proof, args };
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the contract, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
async function generateMerkleProof(deposit) {
  console.log("Getting contract state...");
  currentInfo.setWithdrawStatus(3)
  // const events = await contract.getPastEvents("Deposit", {
  //   fromBlock: 0,
  //   toBlock: "latest",
  // });
  // const leaves = events
  //   .sort((a, b) => {
  //     if (a.returnValues.leafIndex > b.returnValues.leafIndex) {
  //       return 1;
  //     } else if (a.returnValues.leafIndex < b.returnValues.leafIndex) {
  //       return -1;
  //     }
  //     return 0;
  //   }) // Sort events in chronological order
  //   .map((e) => e.returnValues.commitment);
  const url = relayUrl;
  const res = await axios.post(url + "/getDepositEvents", {
    contractAddress: contract._address,
    chainName: "eth"
  }, { headers: { isToken: true } })
  const events = res.data.events
  const leaves = events
    .sort((a, b) => {
      if (Number(a.leafIndex) > Number(b.leafIndex)) {
        return 1;
      } else if (Number(a.leafIndex) < Number(b.leafIndex)) {
        return -1;
      }
      return 0;
    }) // Sort events in chronological order
    .map((e) => e.commitment);
  // let getLastRoot = await contract.methods.getLastRoot().call();
  // console.log(leaves, "leaves")
  const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves);

  // Find current commitment in the tree
  let depositEvent = events.find(
    (e) => e.commitment === toHex(deposit.commitment)
  );
  let leafIndex = depositEvent ? depositEvent.leafIndex : -1;
  leafIndex = Number(leafIndex);
  // Validate that our data is correct (optional)
  let root = toHex(tree.root());
  const isValidRoot = await contract.methods.isKnownRoot(root).call();
  const isSpent = await contract.methods
    .isSpent(toHex(deposit.nullifierHash))
    .call();

  assert(isValidRoot === true, "Merkle tree is corrupted");
  assert(isSpent === false, i18next.t("isSpent"));
  assert(leafIndex >= 0, i18next.t("fail2"));

  // Compute merkle proof of our commitment
  const { pathElements, pathIndices } = tree.path(leafIndex);
  return { pathElements, pathIndices, root: tree.root() };
}

function calculateFee({ withdrawLimt, currency, gasPrice, amount, refund, ethPrices, relayerServiceFee, decimals }) {
  console.log(arguments, "arguments")
  const decimalsPoint =
    Math.floor(relayerServiceFee) === Number(relayerServiceFee) ? 0 : relayerServiceFee.toString().split('.')[1].length;
  const roundDecimal = 10 ** decimalsPoint;
  const total = toBN(fromDecimals({ amount, decimals }));
  const feePercent = total.mul(toBN(relayerServiceFee * roundDecimal)).div(toBN(roundDecimal * 100));
  const expense = toBN(fromDecimals({ amount: (gasPrice * 1.2).toFixed(9), decimals: 9 })).mul(toBN(withdrawLimt));
  let desiredFee;
  switch (currency) {
    case 'eth': {
      desiredFee = expense.add(feePercent);
      break;
    }
    default: {
      desiredFee = expense
        .add(toBN(refund))
        .mul(toBN(10 ** decimals))
        .div(toBN(fromDecimals({ amount: ethPrices, decimals: 18 })))
      desiredFee = desiredFee.add(feePercent);
      break;
    }
  }
  return desiredFee;
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
function getTransactionStatus(hash) {
 
  
  return new Promise((resolve, reject) => {

    const timer = setInterval(() => {
     
      currentInfo.providers.request({
        method: "eth_getTransactionReceipt",
        params: [hash]
      }).then(response => {
        
        if (response.status === "0x1") {
          clearInterval(timer)
          resolve("success")
          return
        }
       
      }).catch(e => {
        clearInterval(timer)
        reject("fail")
      })
    }, 2000)
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
// function aginWithDraw({ contract, proof, args, account, nonce }) {
  
//   const withDraw = async () => {
//     if (!getIspc) {window.location.href ="wc://metamask.io" }
//     const datas = await contract.methods.withdraw(proof, ...args).encodeABI()
//     const hash = await currentInfo.providers.request({
//       method: "eth_sendTransaction",
//       params: [
//         {
//           data: datas,
//           from: account,
//           to: contract._address,
//           nonce: toHex(nonce),

//         }
//       ]
//     })
//     return hash
//   }
//   return new Promise((resolve) => {
//     withDraw().then(hash => {
//       resolve(hash)
//     })
//     //重新发送请求签名
//     const timer1 = setTimeout(async () => {
//       clearTimeout(timer1)
//       currentInfo.setWithdrawStatus(9)
//       const hash = await withDraw()
//       resolve(hash)
//     }, 30000)
//   })
// }