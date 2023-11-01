/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-28 09:33:57
 * @LastEditTime : 2023-08-19 18:41:17
 * @FilePath     : index.ts
 */
import EthereumProvider, { EthereumProvider as EthereumProviderCons } from '@walletconnect/ethereum-provider'
import { PROJECT_ID } from "./config"
import { useState } from "react"
import Web3 from "web3"
import currentInfo from "@/utils/config_index"
import { Toast } from "antd-mobile";
import { local } from "@/utils"
import i18next from 'i18next'
import {networkIds} from "@/utils/deposit/metaMask_config"

let Dialog: ((b: boolean) => void) | undefined;
let setIsConnectLoad: ((b: boolean) => void) | undefined;
const useWalltConnectHook = () => {
    const [providers, setProviders] = useState<EthereumProvider | undefined>()
    const [isWallConnectLoading, setIsWallConnectLoading] = useState(false)
    const createProvider = async () => {
        const provider = await EthereumProviderCons.init({
            projectId: PROJECT_ID,
            // relayUrl: RELAY_URL,
            chains: [1],
            methods: [
                "eth_sendTransaction",
                "eth_getTransactionReceipt",
                "eth_signTransaction",
                "wallet_switchEthereumChain",
                "eth_sign",
                "personal_sign",
                "eth_signTypedData",
                "eth_chainId"
            ],
            events: ["chainChanged", "accountsChanged", "session_event"],
            optionalChains: Object.keys(networkIds).map( item=>(Number(item))),
            metadata: {
                name: "TokenVortex",
                description: "TokenVortex",
                url: "https://mix.poyoo.net",
                icons: ["https://mix.poyoo.net/favicon.ico", "https://mix.poyoo.net/favicon.ico"],
            },

            showQrModal: true,


        });
        setIsWallConnectLoading(true)
        if (provider) {
            _subscribeToProviderEvents(provider)
            currentInfo.providers = provider
        }

        setProviders(provider)
        return provider
    }
    const connect = async (provider: EthereumProvider, setIsShowDialog?: (b: boolean) => void, setIsConnectLoading?: (b: boolean) => void) => {
        Dialog = setIsShowDialog;
        setIsConnectLoad = setIsConnectLoading
        currentInfo.netId = String(provider.chainId);
        try {
            if (!provider?.session) {
                await provider?.connect()
                const timer = setTimeout(async () => {
                    await providers?.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "5" }]
                    })
                    window.clearTimeout(timer)
                }, 1000)
            }
            const web3Provider = new Web3(provider);
            const session = provider?.session
            const _account = await provider?.enable()

            return {
                _account,
                session,
                provider,
                web3Provider,
            }
        } catch (error) {
            let message = String(error);
            console.log(message, "message")
            switch (message) {
                case "Error: Connection request reset. Please try again.":
                    message = i18next.t("resetConnect")
            }
            Toast.show(message)
            return
        }
    }

   
    const _subscribeToProviderEvents = async (_client: any) => {

        if (typeof _client === "undefined") {
            throw new Error("WalletConnect is not initialized");
        }
        // Subscribe to session event
        _client.on("display_uri", async (uri: string) => {
            Dialog && Dialog(false);
            setIsConnectLoad && setIsConnectLoad(false)
            console.log("EVENT", "QR Code Modal open");
        });
        _client.on("session_event", async (uri: string) => {
            console.log(uri,"uri")
        });
        // Subscribe to session ping
        _client.on("chainChanged", (chainId16: string) => {
            
            const chainIds = String(parseInt(chainId16))
            const keys = Object.keys(networkIds);
            const result = keys.find(v => v === chainIds)
            if (!result) {
                Toast.show(`Not Supported This Network`)
                return
            }
            currentInfo.netId = chainIds;
            Toast.show(`Current Network Is ${networkIds[result]}`)
        });
        _client.on("disconnect", () => {
            currentInfo.disConnect()  
            Toast.show(`Connection Dropped`)
        });
        // Subscribe to session update

    }
    const closeConnect = () => {
        const walletType = local.get("walletType");
        if (walletType === "WalletConnect") {
            local.clear()
        } else {
            const code = local.get("code");
            local.clear()
            local.set("walletType", walletType || "")
            local.set("code", code || "")
        }
    }
    return { providers, connect, isWallConnectLoading, createProvider, closeConnect }
}









export default useWalltConnectHook


