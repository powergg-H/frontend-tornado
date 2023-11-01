/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-07 10:04:09
 * @LastEditTime : 2023-08-09 16:39:58
 * @FilePath     : types.d.ts
 */
import EthereumProvider from "@walletconnect/ethereum-provider"
export interface PersonalSignParamsType {
    account: string
    timstamp: number
    inviteCode?: string
    providers: any
    type:string
}
export interface DetailParamsType {
    pageNum: number
    pageSize: number
}
export interface WithdrawParamsType {
    amount: number
    address: string
}


export interface LoginDataType {
    type: "SIGNATURE" | "EMAIL_NUMBER" | "PASSWORD" | "TOKEN"
    identifier: string   //识别标识
    credential?: string   //识别凭证
    inviteCode?: string //邀请码
    timeStamp: string  //	时间戳
    chainName:"tron"|"eth"

}