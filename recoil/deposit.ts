import { atom } from "recoil";
import type {RecoilState} from "recoil"
export interface ExchangeInterface {
  usdc: number;
  eth: number;
  propo:number
  gasPrice:number
  limit:number
  isShowDialog: boolean;
}
interface PriceTokensType {
  address:string
  decimals:number
  name:string
  price:string
}
interface PriceType {
  fees:{
    eth:{
      changeLimit:number
      gasPrice:string
      withdrawLimt:number
    }
    tron:{
      changeEnergy:number
      energyPrice:number
      withdrawEnergy:number
    }
  }
  priceTokens:{
    eth:PriceTokensType[]
    tron:PriceTokensType[]
  }
}


export interface RelayDataType {
  version?:string
  netId?:number
  rewardAccount?:string
  miningServiceFee?:number
  tornadoServiceFee?:number

  ethPrices?:PriceType
  trxPrices?:PriceType
}
export type CurrencyType ="usdc" | "eth" |"usdt" |"trx";

export  interface IDeposit {
  currentTab: "deposit" | "withdraw";
  currency: CurrencyType
  amountList: number[];
  amount: number;
  exchange: ExchangeInterface;
  currencyList:string[]
  setAmoutSelect:(i:number)=>void
  relayData:RelayDataType
}

//币种
export const depositState = atom<IDeposit>({
  key: "depositState",
  default: {
    currentTab: "deposit",
    currency: "eth",
    amountList: [0.1, 1, 10, 100],
    amount: 0.1,
    exchange: {
      usdc: 1,
      eth: 0.002,
      propo:0,//当前代币与eth兑换比例
      gasPrice:0,//gas
      limit:0,
      isShowDialog: false,
    },
    currencyList:["usdt","eth"],
    setAmoutSelect:()=>{},
    relayData:{}
  },
});
