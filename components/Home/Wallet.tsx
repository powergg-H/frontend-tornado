"use client";
import styles from "@/app/home.module.css";
import { Toast, Space, CheckList, List, Avatar, Dialog, DotLoading, Skeleton, Modal } from "antd-mobile";
import { formatString, personalSign } from "@/utils";
import Web3Utils from "@/utils/web3";
import MetaMaskIcon from "@/public/metamask.png";
import defaultWallet from "@/public/default.png";
import MetaMask from "@/public/metamask@2x.png";
import TrxIcon from "@/public/trx@2x.png";
import WalltConent from "@/public/connect.png"
import { useRecoilState } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import { walletState } from "@/recoil/wallet";
import currentInfo from "@/utils/config_index"
import { nedIds } from "@/utils/deposit/tronLink_config"
import Observe, { ResponseDataType } from "@/utils/watch"
import type { StaticImageData } from "next/dist/client/image"
import i18next from 'i18next';
import { ThemePropsType } from "@/recoil/theme"
import { useState, useMemo, useEffect } from "react"
import { getIspc } from "@/utils"
import useWalltConnectHook from "@/wallConnect"
import websnark from "@/websnark";
import { IDeposit } from "@/recoil/deposit"
import { RelayDataType } from "@/recoil/deposit"
import axios from "axios"
import { userState } from "@/recoil/user";
import { local } from "@/utils"
import {relayUrl} from "@/service/config"
export const ConnectedIcon: Record<string, StaticImageData> = {
  "default": defaultWallet,
  "MetaMask": MetaMaskIcon,
  "TronLink": TrxIcon,
  "WalletConnect": WalltConent
}
interface WalletPropsType {
  theme: ThemePropsType
}

export default function Wallet(props: WalletPropsType) {
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [user, setUser] = useRecoilState(userState);
  const [isConnectLoading, setIsConnectLoading] = useState(false)
  const [wallet, setWallet] = useRecoilState(walletState);
  const [depositState, setDepositState] = useRecoilState(deposit);
  const { isWallConnectLoading, connect, providers, createProvider } = useWalltConnectHook()
  const { theme } = props;
  const [isPc, setIsPc] = useState(true)
  const isConnected = useMemo(() => {
    return wallet.account ? true : false

  }, [wallet])
  const putDeposit = (v: string) => {
    const { netId } = currentInfo;
    if (!v) return
    if (!netId) return;
    const str = "netId" + netId
    if (!currentInfo.configJson[str]) return
    const tokensJson = currentInfo.configJson[str][v];
    if (!tokensJson) return  //没有此代币配置信息
    const amountList = []
    for (let key in tokensJson.instanceAddress) {
      if (tokensJson.instanceAddress.hasOwnProperty(key)) {
        amountList.push(Number(key))
      }
    }
    amountList.sort((a, b) => Number(a) - Number(b))
    return amountList

  }
  useEffect(() => {
    websnark.buildGroth16().then(res => {
      currentInfo.build16 = res
    })
    initProvider()
    currentInfo.disConnect=handleDisConnect;
    currentInfo.setUser = setUser
    setIsPc(getIspc())
  }, [])

  const initProvider = () => {
    const type = local.get("walletType");

    if (type) {
      
      const defaultCurrency = type === "TronLink" ? "trx" : "eth";
      currentInfo.defaultCurrency = defaultCurrency
      connectWallet(type, false);
      if (type !== "WalletConnect") {
        createProvider()
      }
    } else {
      //如果跳转的是波场app
      if(location.search.indexOf("utm_source=tronlink")!==-1){
        connectWallet("TronLink", false);
      }
      createProvider()
    }


  }
  const handleChangeWallet = async (v: string[]) => {
    if (!v.length) {
      setIsShowDialog(false)
      return;
    }
    const value: any = v[0];
    if (value === "WalletConnect") {

      setIsConnectLoading(true)
    };


    await connectWallet(value, true)
    setIsShowDialog(false)
  }
  const connectWallet = async (value: any, isClear: boolean) => {
    try {
      if (Web3Utils[value]) {

        const watch = new Observe();
        watch.clear()
        let res;
        try {
          res = await Web3Utils[value](connect, setIsShowDialog, setIsConnectLoading, createProvider);
        } catch (error) {
          
          Toast.show(String(error))
          return
        }
        if (res?.accounts) {
          const currency = currentInfo.defaultCurrency
          const provider = res.web3;
          if (value === "MetaMask") {
            currentInfo.netId = provider.networkVersion;

          }
          if (value === "WalletConnect") {

          }
          if (value === "TronLink") {
            const url = provider.fullNode.host as string
            currentInfo.netId = nedIds[url];

          }
          const nedId = 'netId' + currentInfo.netId;
          const keyJson = currentInfo.configJson[nedId];

          const currencyList = keyJson ? Object.keys(keyJson) : []
          const updatedAmountList = putDeposit(currency);
          const amountList = updatedAmountList ? updatedAmountList : depositState.amountList
       
          const newDepositState = {
            ...depositState,
            currency,
            amountList,
            amount: amountList[0],
            currencyList,
          }
          depositState.setAmoutSelect(0)
          setDepositState(newDepositState)
          setWallet({
            ...wallet,
            account: res?.accounts[0],
            type: value,
          });
          
          currentInfo.currentWalltType = value;
          currentInfo.commonProvider = provider;
          local.set("walletType", value)
          if (isClear) {
            local.remove("code")
            local.remove("token")
          }
          watch.init(value);

          // 监听用户切换变化 更新
          watch.onAccountsChanged((data: ResponseDataType) => {
            const { message, data: datas } = data
            Toast.show(message)
            if (datas !== null && datas.length) {
              currentInfo.account = datas[0];
              local.remove("code")
              local.remove("token")
              setWallet({
                ...wallet,
                account: datas[0],
                type: value,
              });
            }
          })
          // 监听网络线路切换变化 更新
          watch.onChainChanged((data: ResponseDataType) => {
            const { message, data: datas } = data;
            Toast.show(message)
            if (typeof datas === "string") {
              currentInfo.netId = datas
            }
          })
          await getRelayParams(value, newDepositState)
        } else {
          setWallet({
            ...wallet,
            type: "",
            account: "",
          });
        }


      } else {
        setWallet({
          ...wallet,
          type: "",
          account: "",
        });
      }
    } catch (error) {
      Toast.show(String(error))
    }
  }
  //获取relay数据
  const getRelayParams = async (type: string, newDepositState: IDeposit) => {
    const tokens = "USDC"
    const url = relayUrl
    let res: undefined | RelayDataType = undefined;
    let propo;
    let gasPrice;
    let limit;
    switch (type) {
      case "TronLink":
        res = (await axios.get(url + '/status/tron', { headers: { isToken: true } })).data;
        if (!res) return;

        break;
      default:
        res = (await axios.get(url + '/status', { headers: { isToken: true } })).data
        if (!res) return;
        const { ethPrices } = res;
        if (!ethPrices) return
        const { fees: { eth }, priceTokens } = ethPrices;
        gasPrice = eth.gasPrice;
        limit = eth.changeLimit;
        const result = priceTokens.eth.find(v => v.name === tokens);
        if (!result) throw new Error("没有匹配到USDC");
        propo = result.price
        break;
    }
    setDepositState({
      ...newDepositState,
      exchange: {
        ...newDepositState.exchange,
        gasPrice: Number(gasPrice) * Math.pow(10, 9),//gas
        limit: Number(limit),
        propo: Number(propo)
      },
      relayData: res
    })

  }
  const list = useMemo(() => {

    return (<div>
      <Space block justify="center" className={styles.title}>
        {i18next.t("wallet.title")}
      </Space>

      <CheckList
        value={[wallet.type]}
        style={{ "--border-bottom": "0", "--border-top": "0" }}
        onChange={handleChangeWallet}
      >
        {
          isPc && <CheckList.Item value="MetaMask" style={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}>
            <Space align="center">
              <Avatar
                src={MetaMask.src}
                fit="contain"
                style={{ "--size": "2rem" }}
              />
              <span>MetaMask</span>
            </Space>
          </CheckList.Item>
        }
        <CheckList.Item value="TronLink" style={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}>
          <Space align="center">
            <Avatar
              src={TrxIcon.src}
              fit="contain"
              style={{ "--size": "2rem" }}
            />
            <span>TronLink</span>
          </Space>
        </CheckList.Item>
        <CheckList.Item value="WalletConnect">
          <Space align="center">
            <Avatar
              src={WalltConent.src}
              fit="contain"
              style={{ "--size": "2rem" }}
            />
            <span>WalletConnect</span>
            <span style={{ marginLeft: "10%" }}></span>

            {
              isConnectLoading ?
                <DotLoading color='currentColor' /> : null
            }
          </Space>


        </CheckList.Item>
    
      </CheckList>
    </div>)
  }, [theme, isWallConnectLoading, isConnectLoading, wallet, handleChangeWallet]);
  const handleCloseDialog = async () => {

    setIsShowDialog(false)
  }
  const handleClick = () => {
    setIsShowDialog(true)

  };
  const handleDisConnect = async () => {
    switch (wallet.type) {
      case "WalletConnect":
        await currentInfo.providers?.disconnect()

        break;

      default:
        break
    }
    local.clear();
    Toast.show(`Connection Dropped`)
    setWallet({
      ...wallet,
      type: "",
      account: "",
    })
  }
  const renderConnected = useMemo(() => {
    return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <Avatar
        src={(ConnectedIcon[wallet.type] || ConnectedIcon.default).src}
        style={{
          borderRadius: "100%",
          background: "#EFF4FA",
          padding: "10px",
          boxSizing: "border-box",
          '--size': '8rem'
        }}
        fit="fill"
      />
      <span style={{ fontSize: "1rem" }}>{wallet.type}</span>
    </div>
  }, [ConnectedIcon, wallet])
  return (
    <div onClick={handleClick}>
      <List className="wallet-box">
        <List.Item
          prefix={
            <Avatar
              src={(ConnectedIcon[wallet.type] || ConnectedIcon.default).src}
              style={{
                borderRadius: "100%",
                background: "#EFF4FA",
                padding: "10px",
                boxSizing: "border-box",
              }}
              fit="fill"
            />
          }

        >
          <span style={{ color: "#fff", whiteSpace: "nowrap" }}>{wallet?.account ? formatString(wallet?.account) : i18next.t("noConnect")}</span>
        </List.Item>
      </List>
      <Dialog
        visible={isShowDialog && !isConnected}
        closeOnAction
        disableBodyScroll={false}
        className="dialog-wallet"
        content={list}
        maskStyle={{ background: "rgba(0,0,0,.85)" }}
        bodyStyle={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
        actions={
          [
            [
              {
                key: "cancel",
                text: <span style={{ color: "gray" }}>{i18next.t("cancel")}</span>,
              },
              {
                key: "confirm",
                text: i18next.t("enter"),
                onClick: handleCloseDialog,
              },
            ],
          ]
        }
        onClose={handleCloseDialog}
      />
      <Modal
        visible={isShowDialog && isConnected}
        closeOnAction
        disableBodyScroll={false}
        className="dialog-wallet"
        content={renderConnected}
        showCloseButton
        maskStyle={{ background: "rgba(0,0,0,.85)" }}
        bodyStyle={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
        actions={[
          {
            key: 'disconnect',
            text: i18next.t("disconnect"),
            primary: true,
            onClick: handleDisConnect
          },

        ]}
        onClose={handleCloseDialog}
      />

    </div>
  );
}
