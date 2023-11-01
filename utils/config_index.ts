import ethIcon from "@/public/eth@2x.png"
import usdtIcon from "@/public/USDT@2x.png"
import trxIcon from "@/public/trx@2x.png"
import {StaticImageData} from "next/dist/client/image"
import EthereumProviderType  from "@walletconnect/ethereum-provider"
import {SetterOrUpdater} from "recoil"
import { UserType } from "@/recoil/user";


interface ConfigType {
    netId:string,
    account:string,
    defaultCurrency:"usdc" | "eth" | "usdt" | "trx",
    configJson:Record<string,any>
    build16:any
    providers:EthereumProviderType|null //connect私有provider 用来判定服务是否已加载
    commonProvider:any //公共provider 用来实现登录
    currentWalltType:"TronLink"|"MetaMask"|"WalletConnect"
    setUser:SetterOrUpdater<UserType>
    disConnect:()=>void
    setWithdrawStatus:(i:number)=>void
    proving_key:null|ArrayBuffer,
    circuit:any
}

export default { //当前的网络状态 用户地址  网络id 等
    netId:"",
    account:"",
    configJson:{},
    defaultCurrency:"eth",
    build16:null,
    providers:null,
    currentWalltType:"MetaMask",
    commonProvider:null,
    setUser:()=>{},
    disConnect(){},
    setWithdrawStatus:()=>{},
    proving_key:null,
    circuit:null
  } as ConfigType
 
  
export const imgarc: Record<string, StaticImageData> = {
    "eth": ethIcon,
    "usdt": usdtIcon,
    "trx": trxIcon
  }
  
//浏览器唤起app的url
export const SCHEMEURL:Record<string,string>={
  "MetaMask":"wc://metamask.io",
  "TronLink":"tronlinkoutside://pull.activity",
  "WalletConnect":"wc://metamask.io",
}
//查询链交易结果
export const RESULTNETWORK={
  "MetaMask":{
    "5":"https://goerli.etherscan.io/tx/",
    "1":"https://etherscan.io/tx/"
  },
  "TronLink":{
    "0xcd8690dc":"https://nile.tronscan.org/#/transaction/",
    "1":"https://tronscan.org/#/transaction/"
  },
  "WalletConnect":{
    "5":"https://goerli.etherscan.io/tx/",
    "1":"https://etherscan.io/tx/"
  },
}
