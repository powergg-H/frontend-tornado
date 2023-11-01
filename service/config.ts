/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-07 09:19:46
 * @LastEditTime : 2023-08-19 15:34:40
 * @FilePath     : config.ts
 */



type EnvironmentType ="development"|"test"|"production"
const serve=process.env.NODE_ENV;
//分享相关接口地址  开发环境 测试环境 生产环境

const ApiObj:Record<EnvironmentType,string>={
    "development":"http://192.168.2.101:43200",
    "test":"http://192.168.2.101:43200",
    "production":"https://bcagent.yeeu.net"
}

export default ApiObj[serve]


//relay服务相关接口地址  开发环境 测试环境 生产环境
const relayConfigUrl:Record<EnvironmentType,string>={
    "development":"http://192.168.2.227:8000/v1",
    "test":"http://192.168.2.227:8000/v1",
    "production":"https://mix.poyoo.net/v1"
}
const relayUrl=relayConfigUrl[serve]

export {relayUrl}
