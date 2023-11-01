/*
 * @description  : nogas服务脚本
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-21 13:46:10
 * @LastEditTime : 2023-08-21 15:22:19
 * @FilePath     : nogas.js
 */
import { bigInt, toHex, getIspc } from "@/utils";
import jsonUsdcContract from "@/contracts/noGas/Usdc.json"
import i18next from 'i18next';
import { ethers } from 'ethers'
import { getStandardErc2612PermitData, getSig } from "@/utils/deposit/eip2612"
import jsonNogasContract from "@/contracts/noGas/NoGas.json"
import snarkjs from "@/snarkjs";
import axios from "axios";
import currentInfo from "@/utils/config_index";
const TIMEOUT_TIME = 5//交易过期时间（分钟）

let nogasContractAddress = '0x7aA55EF40549a1D7b579831487Ce97a22062AE9e'
const usdcAddress = "0x41107C0C5B1BF2cEc390B0878e512f4383718a94"



const gas = (50 * 10 ^ 9 * 200000) / 10 ^ 18 * 2000;











/**
 * @param {String} 网络id 
 * @param {String} 网络id 
 * @param {String} 网络id 
 * @param {String} 网络id 
 * @param {String} 网络id 
 * @param {String} 网络id 
 * @returns 
 * 
 * 
 */
async function ChangeGas(data) {
  const { netId: chainId, address, relayAddress, tokens, gasAmountNum, ethMinLimit, provider } = data;
  if (chainId !== "5") {
    throw new Error(i18next.t("nogas.fail"))
  }
  let providers;
  if (currentInfo.currentWalltType === "WalletConnect") {
    providers = new ethers.BrowserProvider(provider);
  } else {
    providers = new ethers.JsonRpcProvider('https://goerli.infura.io/v3/4b745fc2abac4fcc9ff1f1d2cf2da6fb');
  }
  // const 
  const erc20 = new ethers.Contract(usdcAddress, jsonUsdcContract.abi, { provider: providers })
  //准备permit相关参数
  const from = address
  // const domainSeparator = await erc20.DOMAIN_SEPARATOR();

  const nonce = await erc20.nonces(from)
  // const permitData =  await getStandardErc2612PermitData(domainSeparator, walletWithDraw, nogasContractAddress, ethers.parseUnits("100",18), nonce)
  const exchangeTokenAmount = ethers.parseUnits(String(tokens - gasAmountNum), 18);
  const gasAmount = ethers.parseUnits(String(gasAmountNum), 18);
  const exchangeEthMinLimit = 0;
  // const gasPrice = ethers.parseUnits("50", "gwei");

  const permitData = await signPermit({ chainId, from, nonce, tokens })
  await setTime()
  const sig = await personalSign({ chainId, permitData, from, exchangeTokenAmount, exchangeEthMinLimit, gasAmount })
  // const sig = await getSig(5, nogasContractAddress, usdcAddress, permitData, walletWithDraw, exchangeTokenAmount, exchangeEthMinLimit, gasAmount);
  //发送换取gas的交易


  const response = await axios.post(relayAddress + '/changeGas', {
    chainName: "etherum",
    tokenAdderss: usdcAddress,
    permitData,
    signer: from,
    sig,
    exchangeTokenAmount: String(exchangeTokenAmount),
    exchangeEthMinLimit: String(exchangeEthMinLimit),
    gasAmount: String(gasAmount)
  })

  const { id } = response.data;
  const result = await getStatus(id, relayAddress);
  console.log(result,"result")
  return result
}

const signPermit = async ({ chainId, from, nonce, tokens }) => {
  const time = parseInt(new Date() * 1 / 1000) + TIMEOUT_TIME * 60;
  const domain = {
    name: 'Usdc',
    version: '1',
    verifyingContract: usdcAddress,
    chainId,
  };

  const EIP712Domain = [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'version',
      type: 'string',
    },
    {
      name: 'chainId',
      type: 'uint256',
    },
    {
      name: 'verifyingContract',
      type: 'address',
    },
  ];

  const permit = {
    owner: from,
    spender: nogasContractAddress,
    value: String(ethers.parseUnits(String(tokens), 18)),
    nonce: String(nonce),
    deadline: time,
  };

  const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ];

  const splitSig = (sig) => {
    const pureSig = sig.replace('0x', '');

    const _r = Buffer.from(pureSig.substring(0, 64), 'hex');
    const _s = Buffer.from(pureSig.substring(64, 128), 'hex');
    const _v = Buffer.from(
      parseInt(pureSig.substring(128, 130), 16).toString(),
    );

    return { _r, _s, _v };
  };

  let sign;
  let r;
  let s;
  let v;

  const msgParams = {
    types: {
      EIP712Domain,
      Permit,
    },
    primaryType: 'Permit',
    domain,
    message: permit,
  };

  if (currentInfo.currentWalltType === "WalletConnect") {
    sign = await currentInfo.providers.request({
      method: 'eth_signTypedData',
      params: [from, JSON.stringify(msgParams)]
    })
  } else {
    sign = await ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [from, JSON.stringify(msgParams)],
    });
  }

  const { _r, _s, _v } = splitSig(sign);
  r = `0x${_r.toString('hex')}`;
  s = `0x${_s.toString('hex')}`;
  v = _v.toString();
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  const encodedParam = abiCoder.encode(
    [
      'address',
      'address',
      'uint256',
      'uint256',
      'uint8',
      'bytes32',
      'bytes32',
    ],
    [
      from,
      nogasContractAddress,
      String(ethers.parseUnits(String(tokens), 18)),
      time,
      v,
      r,
      s,
    ],
  );

  return encodedParam;
}

const personalSign = async ({ chainId, permitData, from, exchangeTokenAmount, exchangeEthMinLimit, gasAmount }) => {
  const exampleMsg = `0x${[
    '0x19',
    '0x00',
    ethers.zeroPadValue(ethers.toBeHex(chainId), 32), ,
    nogasContractAddress,
    usdcAddress,
    permitData,
    from,
    ethers.zeroPadValue(ethers.toBeHex(exchangeTokenAmount), 32),
    ethers.zeroPadValue(ethers.toBeHex(exchangeEthMinLimit), 32),
    ethers.zeroPadValue(ethers.toBeHex(gasAmount), 32),
  ]
    .map((hex) => hex.slice(2))
    .join('')}`;
  const hash = ethers.keccak256(exampleMsg);
  try {
    let sign;
    if (currentInfo.currentWalltType === "WalletConnect") {
      sign = await currentInfo.providers.request({
        method: 'personal_sign',
        params: [hash, from],
      });
    } else {
      sign = await ethereum.request({
        method: 'personal_sign',
        params: [hash, from],
      });
    }

    return sign
  } catch (err) {
    console.error(err);
  }
}

const setTime = () => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      
      resolve()
    }, 1000)
  })
}
function getStatus(id, relayerURL) {
  return new Promise((resolve, reject) => {
    async function getRelayerStatus() {
      const responseStatus = await axios.get(relayerURL + '/jobs/' + id,);
      if (responseStatus.status === 200) {
        const { txHash, status, confirmations, failedReason } = responseStatus.data

        console.log(`Current job status ${status}, confirmations: ${confirmations}`);
        console.log(failedReason,"failedReason");
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

export default ChangeGas