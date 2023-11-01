/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-28 09:27:09
 * @LastEditTime : 2023-07-28 09:30:36
 * @FilePath     : walltConnect.ts
 */
import { atom } from "recoil";
import UniversalProvider from "@walletconnect/universal-provider";
import { Web3Modal } from "@web3modal/standalone";
interface IWallet {
    provider: undefined | UniversalProvider
    modal: undefined | Web3Modal

}

export const walltConnectState = atom<IWallet>({
    key: "walltConnect",
    default: {
        provider: undefined,
        modal: undefined
    }
});
