/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-28 13:51:14
 * @LastEditTime : 2023-08-19 16:25:57
 * @FilePath     : nogas_trx.js
 */
//tronlink官方还不支持  但是代码是有的 留待以后使用吧。。。
import jsonUsdcContract from "@/contracts/noGas/Usdc.json"
import jsonNogasContract from "@/contracts/noGas/NoGas.json"
import TronWeb from "tronweb"
import { ethers } from "ethers"
import i18next from 'i18next';
import snarkjs from "@/snarkjs";
import axios from "axios";
import { sign } from "crypto";
const bigInt = snarkjs.bigInt;
const PRIVATE_KEY = '8a07cb7d8c376d8aa29bb8246e4443de073e095f8a5c38c8a05ef21b20359dac'
const TIMEOUT_TIME = 5//交易过期时间（分钟）
let tronWeb, usdcAddressHex, nogasContractAddressHex;
let nogasContractAddress = 'TMfu5ZhJhLKmd81mrqjWbEEauhASyLNSD7';
let usdcAddress = 'TUfYVsn2q7hkB6kxiR6qPH2tKCxPbJaXzQ';
const getBytes = TronWeb.utils.ethersUtils.arrayify
let tronWeb1 = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': '74886d22-9317-47f4-92c5-f72e9bf661eb' },
    privateKey: "4d8ee01386296a88df088f83ba47695c4e2fad84b5d748d5a14ccf9abbe68dd4"
})

async function ChangeGas(data) {
    const { netId: chainId, address: senderAccount, relayAddress, tokens, gasAmountNum, ethMinLimit } = data;
    console.log(chainId, "chainId")
    if (chainId !== "0xcd8690dc") {
        throw new Error(i18next.t("nogas.fail"))
    }
    tronWeb = window.tron.tronWeb;
    usdcAddressHex = tronWeb.address.toHex(usdcAddress).slice(2)
    nogasContractAddressHex = tronWeb.address.toHex(nogasContractAddress).slice(2)
    const senderAccountHex = tronWeb.address.toHex(senderAccount).slice(2)

    const erc20 = await tronWeb?.contract(jsonUsdcContract.abi, usdcAddress);
    const nogasContract = await tronWeb1?.contract(jsonNogasContract.abi, nogasContractAddress)
    //准备permit相关参数
    const exchangeTokenAmount = ethers.parseUnits('8', 6)
    const exchangeEthMinLimit = ethers.parseUnits('80', 6)
    const gasAmount = ethers.parseUnits('2', 6)
    const domainSeparator = await erc20.DOMAIN_SEPARATOR().call()
    const nonce = await erc20.nonces(senderAccountHex).call()
    // const permitData = await signPermit({ chainId, from: senderAccount, nonce, tokens })
    // const sig = await personalSign({ chainId, permitData, from: senderAccount, exchangeTokenAmount, exchangeEthMinLimit, gasAmount })
    // const permitSign = await getStandardErc2612PermitData(domainSeparator, `0x${senderAccountHex}`, `0x${nogasContractAddressHex}`, ethers.parseUnits('10', 18), nonce.toString(), `0x${PRIVATE_KEY}`)

    // const { hash, sig, signHash } = await getSig(netId, `0x${nogasContractAddressHex}`, `0x${usdcAddressHex}`, permitSign.encodedParam, `0x${senderAccountHex}`, exchangeTokenAmount, exchangeEthMinLimit, gasAmount, `0x${PRIVATE_KEY}`)
    
    console.log(domainSeparator,"domainSeparator")
    console.log(senderAccountHex,"senderAccountHex")
    console.log(String(nonce),"nonce")
    const permitData = await signPermit({ domainSeparator, from: senderAccountHex, nonce })
    const sign = await personalSign({ chainId, permitData, from: senderAccountHex, exchangeTokenAmount, exchangeEthMinLimit, gasAmount })
    //发送换取gas的交易
    console.log(permitData,1)
    console.log(sign,2)
    return 
    const tx = await nogasContract.exchangeGas(usdcAddress, permitData, senderAccount,
        sign, exchangeTokenAmount, exchangeEthMinLimit, gasAmount).send({
            feeLimit: 100000000,
            callValue: 0,
            // shouldPollResponse:true
        })
       
    console.log(`View transaction on tronscan https://nile.tronscan.org/#/transaction/${tx}`)
    // try {

    //     const response = await axios.post(relayAddress + '/changeGas', {
    //         chainName: "tron",
    //         tokenAdderss: usdcAddress,
    //         permitData,
    //         signer: from,
    //         sig,
    //         exchangeTokenAmount: String(exchangeTokenAmount),
    //         exchangeEthMinLimit: String(exchangeEthMinLimit),
    //         gasAmount: String(gasAmount)
    //     })

    //     const { id } = response.data;
    //     const result = await getStatus(id, relayAddress);

    //     return result
    // } catch (e) {
    //     if (e.response) {
    //         console.error(e.response.data.error);
    //     } else {
    //         console.error(e.message);
    //     }
    // }
}
const signPermit = async ({ chainId, from, nonce, tokens }) => {
    const time = parseInt(new Date() * 1 / 1000) + TIMEOUT_TIME * 60;
    const domain = {
        name: 'Usdc',
        version: '1',
        verifyingContract: usdcAddressHex,
        chainId,
    };

    const EIP712Domain = [
        {
            name: 'name',
            type: 'string',
        },
        {
            name: 'version',
            type: 'string',
        },
        {
            name: 'chainId',
            type: 'uint256',
        },
        {
            name: 'verifyingContract',
            type: 'address',
        },
    ];

    const permit = {
        owner: from,
        spender: nogasContractAddressHex,
        value: String(ethers.parseUnits(String(10), 18)),
        nonce: String(nonce),
        deadline: time,
    };

    const Permit = [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ];

    const splitSig = (sig) => {
        const pureSig = sig.replace('0x', '');

        const _r = Buffer.from(pureSig.substring(0, 64), 'hex');
        const _s = Buffer.from(pureSig.substring(64, 128), 'hex');
        const _v = Buffer.from(
            parseInt(pureSig.substring(128, 130), 16).toString(),
        );

        return { _r, _s, _v };
    };

    let sign;
    let r;
    let s;
    let v;

    const msgParams = {
        types: {
            EIP712Domain,
            Permit,
        },
        primaryType: 'Permit',
        domain,
        message: permit,
    };


    // sign = await tronWeb?.request({
    //     method: 'tron_signTypedData',
    //     params: [from, JSON.stringify(msgParams)],
    // });
    const fn=(a,b)=>{
        console.log(a,"a")
        console.log(b,"b")
        return b
    }
    const trx= new TronWeb.Trx(tronWeb)
    sign =  await  trx._signTypedData(domain,msgParams.types,permit)
    const { _r, _s, _v } = splitSig(sign);
    r = `0x${_r.toString('hex')}`;
    s = `0x${_s.toString('hex')}`;
    v = _v.toString();
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encodedParam = abiCoder.encode(
        [
            'address',
            'address',
            'uint256',
            'uint256',
            'uint8',
            'bytes32',
            'bytes32',
        ],
        [
            from,
            nogasContractAddressHex,
            String(ethers.parseUnits(String(10), 18)),
            time,
            v,
            r,
            s,
        ],
    );

    return encodedParam;
}

const personalSign = async ({ chainId, permitData, from, exchangeTokenAmount, exchangeEthMinLimit, gasAmount }) => {
    const exampleMsg = `0x${[
        '0x19',
        '0x00',
        ethers.zeroPadValue(ethers.toBeHex(chainId), 32), ,
        nogasContractAddressHex,
        usdcAddressHex,
        permitData,
        from,
        ethers.zeroPadValue(ethers.toBeHex(exchangeTokenAmount), 32),
        ethers.zeroPadValue(ethers.toBeHex(exchangeEthMinLimit), 32),
        ethers.zeroPadValue(ethers.toBeHex(gasAmount), 32),
    ]
        .map((hex) => hex.slice(2))
        .join('')}`;

    const hash = ethers.keccak256(exampleMsg);
    try {

        const sign = await tronWeb.request({
            method: 'personal_sign',
            params: [hash, from],
        });
        return sign
    } catch (err) {
        console.error(err);
    }
}
// const ethSign = async ({ domainSeparator, from, nonce }) => {
//     const permitHash = ethers.keccak256(
//         Buffer.from(
//             'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)',
//         ),
//     );

//     const abiCoder = ethers.AbiCoder.defaultAbiCoder();

//     // const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 60;
//     // console.log('deadline', deadline);
//     const structHash = ethers.keccak256(
//         abiCoder.encode(
//             ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
//             [
//                 permitHash,
//                 from,
//                 nogasContractAddressHex,
//                 ethers.parseUnits('10', 18), //最终授权数量
//                 String(nonce),
//                 50000000000,
//             ],
//         ),
//     );

//     const exampleMsg = `0x${['0x19', '0x01', domainSeparator, structHash]
//         .map((hex) => hex.slice(2))
//         .join('')}`;
//     const hash = ethers.keccak256(exampleMsg);
//     console.log(structHash,"structHash")
//     console.log(exampleMsg,"exampleMsg")
//     console.log(hash,"hash")
//     const splitSig = (sig) => {
//         const pureSig = sig.replace('0x', '');

//         const _r = Buffer.from(pureSig.substring(0, 64), 'hex');
//         const _s = Buffer.from(pureSig.substring(64, 128), 'hex');
//         const _v = Buffer.from(
//             parseInt(pureSig.substring(128, 130), 16).toString(),
//         );

//         return { _r, _s, _v };
//     };

//     let sign;
//     let r;
//     let s;
//     let v;

//     try {

//         sign = await tronWeb.trx.sign(getBytes(hash))
//         const { _r, _s, _v } = splitSig(sign);
//         r = `0x${_r.toString('hex')}`;
//         s = `0x${_s.toString('hex')}`;
//         v = _v.toString();
//         console.log(sign,"sign")
//         const abiCoder = ethers.AbiCoder.defaultAbiCoder();
//         const encodedParam = abiCoder.encode(
//             [
//                 'address',
//                 'address',
//                 'uint256',
//                 'uint256',
//                 'uint8',
//                 'bytes32',
//                 'bytes32',
//             ],
//             [
//                 from,
//                 nogasContractAddressHex,
//                 ethers.parseUnits('10', 18),
//                 50000000000,
//                 v,
//                 r,
//                 s,
//             ],
//         );

//         return encodedParam;
//     } catch (err) {
//         console.error(err);
//     }
// }
// const personalSign = async ({ chainId, permitData, from, exchangeTokenAmount, exchangeEthMinLimit, gasAmount }) => {
//     const exampleMsg = `0x${[
//         '0x19',
//         '0x00',
//         chainId,
//         nogasContractAddressHex,
//         usdcAddressHex,
//         permitData,
//         from,
//         ethers.zeroPadValue(ethers.toBeHex(exchangeTokenAmount), 32),
//         ethers.zeroPadValue(ethers.toBeHex(exchangeEthMinLimit), 32),
//         ethers.zeroPadValue(ethers.toBeHex(gasAmount), 32),
//     ]
//         .map((hex) => hex.slice(2))
//         .join('')}`;
//     const hash = ethers.keccak256(exampleMsg);
//     const signHash = ethers.hashMessage(ethers.getBytes(hash))
//     try {

//         const sign = await tronWeb.trx.sign(getBytes(signHash));
//         return sign
//     } catch (err) {
//         console.error(err);
//     }
// }
export function toHex(number, length = 32) {
    const str =
        number instanceof Buffer
            ? number.toString("hex")
            : bigInt(number).toString(16);
    return "0x" + str.padStart(length * 2, "0");
}
export default ChangeGas
