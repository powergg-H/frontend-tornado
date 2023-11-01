/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-07 12:53:21
 * @LastEditTime : 2023-08-08 13:08:53
 * @FilePath     : user.ts
 */
import { atom } from "recoil";

export interface UserType {
  accessToken:string
  expireTime:number
  inviteCode :string
  refreshExpireTime:number
  refreshToken:string
  userId:string
}

export const userState = atom<UserType>({
  key: "User",
  default: {
    accessToken: "",
    expireTime:0,
    refreshExpireTime:0,
    refreshToken:"",
    userId:"",
    inviteCode:""
  },
});
