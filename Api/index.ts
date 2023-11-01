/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-07 09:42:59
 * @LastEditTime : 2023-08-18 16:16:16
 * @FilePath     : index.ts
 */
import axios from "@/service"
import { LoginDataType, DetailParamsType, WithdrawParamsType } from "./types";
import { Toast } from "antd-mobile";
import i18next from 'i18next';
import { local } from "@/utils/index"
const getMessage = (code: string) => {
    return i18next.t(`message.${code}`)
}
//登录
export const getLogin = async (params: LoginDataType) => {
    const res = await axios.post("/user/auth/login", params);
    const { data: { code, message, data } } = res;
    if (!code || code !== "00000") {
        Toast.show({
            icon: "fail",
            content: getMessage(code)
        })
        return
    }
    local.set("code", data.inviteCode)
    local.set("token", data.accessToken)
    return data

}
//收入明细
export const getDetail = async (params: DetailParamsType) => {
    const res = await axios.get("/user/account/detail/page", {
        params,
    });
    const { data: { code, message, data } } = res;
    if (!code || code !== "00000") {
        Toast.show({
            icon: "fail",
            content: getMessage(code)
        })
        return
    }
    return data

}
//提现记录
export const getHistory = async (params: DetailParamsType) => {
    const res = await axios.get("/user/account/record/page", {
        params
    });
    const { data: { code, message, data } } = res;
    if (!code || code !== "00000") {
        Toast.show({
            icon: "fail",
            content: getMessage(code)
        })
        return
    }
    return data

}
//提现
export const getWithdraw = async (params: WithdrawParamsType) => {
    const res = await axios.post("/user/account/record/withdraw", params);
    const { data: { code, message, data } } = res;
    if (!code || code !== "00000") {
        Toast.show({
            icon: "fail",
            content: getMessage(code)
        })
        return
    }
    return res.data

}
//查询交易结果
export const getResultStatus = (params: any) => {
    const { url, ...rest } = params
    return new Promise((resolve, reject) => {
       const timer= setInterval(() => {
            axios.post(url + "/getTransactionResult", rest, { headers: { isToken: true } }).then(res => {
                const { data: { status } } = res
                if (status === 1) {
                    clearInterval(timer)
                    resolve(status)
                }
                if(status === 0){
                    clearInterval(timer)
                    reject(status)
                }
            })
        }, 3000)
    })
}