import snarkjs from "@/snarkjs";
import { toBN } from "web3-utils"
import BN from "bn.js"
import { CurrencyType } from "@/recoil/deposit"
import { PersonalSignParamsType } from "@/Api/types"
import { ethers } from "ethers"
import { Toast } from "antd-mobile"
import i18next from "i18next";
export const bigInt: any = snarkjs.bigInt;

export function toHex(numbers: any, length = 32) {
  const str = numbers instanceof Buffer
    ? numbers.toString("hex") : bigInt(numbers).toString(16);
  return "0x" + str.padStart(length * 2, "0");
}
export function formatString(str: string) {
  if (str.length <= 8) {
    return str;
  }

  const firstFour = str.substr(0, 4);
  const lastFour = str.substr(str.length - 4, 4);

  return `${firstFour}...${lastFour}`;
}

export function generateRandomNumber(min: number, max: number, decimalPlaces: number) {
  let randomNumber = Math.random() * (max - min) + min;
  let roundedNumber = randomNumber.toFixed(decimalPlaces);
  let paddedNumber = roundedNumber.padEnd(decimalPlaces + 2, '0');
  return parseFloat(paddedNumber);
}

export function generateRandomString() {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}

export function generateRandomHex() {
  let characters = '0123456789ABCDEF';
  let randomHex = '0x';
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomHex += characters.charAt(randomIndex);
  }
  return randomHex;
}
export function fromDecimals({ amount: amounts, decimals }: { amount: number, decimals: number }) {
  const amount = amounts.toString()
  let ether = amount.toString()
  const base = new BN('10').pow(new BN(decimals))

  const baseLength = base.toString(10).length - 1 || 1

  const negative = ether.substring(0, 1) === '-'

  console.log(negative, "negative")

  if (negative) {
    ether = ether.substring(1)
  }

  if (ether === '.') {
    throw new Error('[ethjs-unit] while converting number ' + amount + ' to wei, invalid value')
  }

  // Split it into a whole and fractional part
  const comps = ether.split('.')
  if (comps.length > 2) {
    throw new Error(
      '[ethjs-unit] while converting number ' + amount + ' to wei,  too many decimal points',
    )
  }

  let whole = comps[0]
  let fraction = comps[1]

  if (!whole) {
    whole = '0'
  }
  if (!fraction) {
    fraction = '0'
  }
  if (fraction.length > baseLength) {
    throw new Error(
      '[ethjs-unit] while converting number ' + amount + ' to wei, too many decimal places',
    )
  }

  while (fraction.length < baseLength) {
    fraction += '0'
  }
  const wholeBN = new BN(whole)
  const fractionBN = new BN(fraction)
  let wei: BN | string = wholeBN.mul(base).add(fractionBN)

  // if (negative) {
  //   wei = wei.mul(negative)
  // }

  return new BN(wei.toString(10), 10)
}



/**
 * @description 判断当前环境
 * @returns {booble} true pc false 移动端
 * 
 */
export const getIspc = () => {
  if (!window || !navigator) return false
  let userAgent = navigator.userAgent.toLowerCase();
  // 用 test 匹配浏览器信息
  if (/ipad|iphone|midp|rv:1.2.3.4|ucweb|android|windows ce|windows mobile/.test(userAgent)) {
    return false
  }
  return true
}

//钱包登录获取签名
export const personalSign = async ({ account, inviteCode = "", providers, timstamp, type }: PersonalSignParamsType) => {
  try {
    if (!providers) return "";
    const message = {
      address: account,
      // timstamp: 1691463800876,
      timstamp,
      inviteCode
    }

    let messageHex = "0x0" + message.address.slice(2) + message.timstamp + message.inviteCode
    const messageHash = ethers.keccak256(messageHex)
    let sign
    if (type === "MetaMask" || type === "WalletConnect") {
      sign = await providers.request({
        method: 'personal_sign',
        params: [messageHash, account],
      });
    }
    if (type === "TronLink") {
      sign = await (providers).trx.signMessageV2(messageHex);

    }
    return sign
  } catch (err) {
    console.error(err);
  }
}
export const local = {


  get(key: string) {
    return window && window.localStorage.getItem(key)
  },
  set(key: string, value: string | Record<string, any>) {
    if (typeof value === "object") {
      window && window.localStorage.setItem(key, JSON.stringify(value))
    } else {
      window && window.localStorage.setItem(key, value)
    }
  },
  remove(key: string) {
    window && window.localStorage.removeItem(key)
  },
  clear() {
    window && window.localStorage.clear()
  }


}


export function copyCot(cot: string) {
  const pEle = document.createElement('p');
  pEle.innerHTML = cot || '';
  document.body.appendChild(pEle);

  const range = document.createRange(); // 创造range
  if (window) {
    const getSelection = window.getSelection()
    if (getSelection) {
      getSelection.removeAllRanges()
    }
    range.selectNode(pEle); // 选中需要复制的节点
    const newSelection = window.getSelection();
    newSelection && newSelection.addRange(range); // 执行选中元素

    const copyStatus = document.execCommand("Copy"); // 执行copy操作

    copyStatus ? Toast.show(i18next.t("copy.success")) : Toast.show(i18next.t("copy.fail"));
    document.body.removeChild(pEle);
    const remove = window.getSelection()
    if (remove) {
      remove.removeAllRanges()
    }
  }

}
