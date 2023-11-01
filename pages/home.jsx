/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-14 16:04:04
 * @LastEditTime : 2023-08-21 10:38:08
 * @FilePath     : home.jsx
 */
import React, { useEffect,useState } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider'
const Home = () => {
    const [provider,setProvider] =useState()
    useEffect(()=>{
        init()
    })
    const init=async()=>{
        const provider=await EthereumProvider.init({
            projectId:"f9a56d756c64e8d4b306baa1ee8b2b8e",
            chains:[1],
            optionalChains:[5],
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
            showQrModal: true,
        })
        event(provider)
        setProvider(provider)
    }
    const handleConnect = () => {
        provider.connect()
    }
    const event=(provider)=>{
        provider.on('chainChanged', (e)=>{
            console.log(e,"chainChanged")
        })
        provider.on('session_event', (e)=>{
            console.log(e,"session_event")
        })
    }
    return <div>
       <button onClick={handleConnect}>连接</button>
    </div>
}

export default Home