/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-10 10:57:59
 * @LastEditTime : 2023-08-13 18:52:24
 * @FilePath     : watch.ts
 */

/**
 * @param {string} walletType 钱包类型  每个钱包类型不同 监听事件不同
 * 
 */
import { nedIds } from "@/utils/deposit/tronLink_config";
import i18next  from "i18next";
type HasEventType = "onAccountsChanged" | "onChainChanged"
export interface ResponseDataType {
    code: number
    message: string,
    data: string[] | string | null
}
class Observe {
    private walletType: string | undefined;
    private isEvent: boolean;
    private accountsChangedCallBack: (undefined | ((l: ResponseDataType) => void));
    private chainChangedCallBack: (undefined | ((l: ResponseDataType) => void));
    private clearAccountsChanged: (undefined | ((l: string[]) => void));
    private clearChainChanged: (undefined | ((l: string) => void));
    private clearTronLinkEvent: (undefined | ((l: any) => void));
    static instance: Observe | undefined
    constructor() {
        this.walletType;
        this.accountsChangedCallBack;
        this.chainChangedCallBack;
        this.isEvent = false
        this.clearAccountsChanged;
        this.clearChainChanged;
        this.clearTronLinkEvent
        ///单例模式  保证监听对象只有一个即可
        if (!Observe.instance) {
            Observe.instance = this;
            return this;
        }
        return Observe.instance
    }
    //初始化钱包
    init(walletType: string) {
        this.walletType = walletType;
        return this
    }
    onAccountsChanged(callback: (l: ResponseDataType) => void) { //监听用户变化
        switch (this.walletType) {
            case "TronLink":
                this.isHasEvent("onAccountsChanged", callback)

                break;
            case "MetaMask":
                const web3 = (window as any).web3;
                if (!web3) {
                   throw new Error("Please install MetaMask or reconnect")
                  
                }
                const provider = web3.currentProvider;
                this.clearAccountsChanged = (valueList: string[]) => {
                    callback({
                        code: 200,
                        message: i18next.t("switch"),
                        data: valueList
                    })
                }
                provider.on("accountsChanged", this.clearAccountsChanged)
                break;


        }
    }
    onChainChanged(callback: (l: ResponseDataType) => void) { //监听网络变化
        switch (this.walletType) {
            case "TronLink":
                this.isHasEvent("onChainChanged", callback)
                break;
            case "MetaMask":
                const web3 = (window as any).web3;
                if (!web3) {
                    throw new Error("Please install MetaMask or reconnect")
                    return
                }
                const provider = web3.currentProvider;
                this.clearChainChanged = (value: string) => {
                    callback({
                        code: 200,
                        message: i18next.t("network"),
                        data: String(Number(value))
                    })
                }
                provider.on("chainChanged", this.clearChainChanged)
                break;
        }
    }
   
    clear() {
        this.isEvent = false;
        this.walletType = undefined;
        this.accountsChangedCallBack = undefined;
        this.chainChangedCallBack = undefined;
        this.metaMaskClear()
        this.tronLinkClear()

    }
    isHasEvent(type: HasEventType, callback: (l: ResponseDataType) => void) { //监测tronlink钱包下，触发监听事件前是否已经有了message事件
        if (type === "onAccountsChanged") {
            this.accountsChangedCallBack = callback;
        } else {
            this.chainChangedCallBack = callback
        }
        if (!this.isEvent) {
            this.isEvent = true;
            this.onTronLinkEvent()
        }

    }

    onTronLinkEvent() {
        this.clearTronLinkEvent = (e) => {
            if (e.data.message && e.data.message.action == "accountsChanged") {
                const { data = { address: "" } } = e.data.message
                if (!this.accountsChangedCallBack) return
                if (data.address) {
                    this.accountsChangedCallBack({
                        code: 200,
                        message: i18next.t("switch"),
                        data: [data.address]
                    }) //如果是监听用户方法触发
                    return
                }
                this.accountsChangedCallBack({
                    code: 400,
                    message:i18next.t("user.fail"),
                    data: null
                })
                return

            }
            if (e.data.message && e.data.message.action == "setNode") { //网络变化
                //如果是监听网络方法触发
                console.log(e.data.message)
                const { data = { node: { fullNode: "www" } } } = e.data.message;
                const urlNode = data.node.fullNode;
                if (!this.chainChangedCallBack) return
                if (nedIds[urlNode]) {
                    this.chainChangedCallBack({
                        code: 200,
                        message: i18next.t("network"),
                        data: nedIds[urlNode]
                    })
                    return
                }
                this.chainChangedCallBack({
                    code: 400,
                    message: i18next.t("network.supported"),
                    data: null
                })

                return
            }

        }
        window.addEventListener("message", this.clearTronLinkEvent)
    }

    metaMaskClear() {
        const web3 = (window as any).web3;
        if (!web3) return
        const provider = web3.currentProvider;
        this.clearAccountsChanged && provider.removeListener("accountsChanged", this.clearAccountsChanged)
        this.clearChainChanged && provider.removeListener("chainChanged", this.clearChainChanged)
        this.clearAccountsChanged = undefined;
        this.clearChainChanged = undefined
    }
    tronLinkClear() {
        this.clearTronLinkEvent && window.removeEventListener("message", this.clearTronLinkEvent)
        this.clearTronLinkEvent = undefined
    }
}
export default Observe