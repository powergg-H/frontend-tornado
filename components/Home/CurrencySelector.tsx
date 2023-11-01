"use client";
import { useMemo } from "react"
import styles from "./home.module.css";
import { Space, Dialog, CheckList, Avatar, Toast } from "antd-mobile";
import classNames from "classnames/bind";
import { RightOutline } from "antd-mobile-icons";
import EthIcon from "@/public/dollar@2x.png";
import Dollar from "@/public/eth@3x.png";
import { walletState } from "@/recoil/wallet";
import { useRecoilState, useRecoilValue } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import currentInfo,{imgarc} from "@/utils/config_index"
import { themeState } from "@/recoil/theme";
import i18next from 'i18next';
let cx = classNames.bind(styles);




interface CurrencySelectorPropsType {
  handleSetCurrent: ((num: number) => void) | undefined
}
export default function CurrencySelector(props: CurrencySelectorPropsType) {
  const [depositState, setDepositState] = useRecoilState(deposit);
  const wallet = useRecoilValue(walletState);
  const [theme, setTheme] = useRecoilState(themeState);
  let DialogInstance: any = null;


  const currencyList = useMemo(() => {
    return depositState.currencyList
  }, [depositState.currencyList])
  const currentIcon = depositState.currency === "usdc" ? EthIcon : Dollar;
  const list = (
    <div>
      <Space block justify="center" className={styles.title}>
       {i18next.t("change.tokens")}
      </Space>
      <CheckList
        value={[depositState.currency]}
        style={{ "--border-bottom": "0", "--border-top": "0" }}
        onChange={async (v) => {
          if (v.length) {
            const updatedAmountList = putDeposit(v[0]);
            const amountList = updatedAmountList ? updatedAmountList : depositState.amountList;

            setDepositState({
              ...depositState,
              currency: v[0] as any,
              amountList,
              amount: amountList[0]
            });
            depositState.setAmoutSelect(0)
          }
          DialogInstance?.close && DialogInstance.close();
        }}
      >
        {/* <CheckList.Item value="USDC">
          <Space>
            <Avatar
              src={EthIcon.src}
              fit="contain"
              style={{ "--size": "1.5rem" }}
            />
            <span>USDC</span>
          </Space>
        </CheckList.Item> */}

        {currencyList.map(item => (
          <CheckList.Item value={item} key={item} style={{background: theme.skin === "dark" ? "#2F343D" : "#fff"}}>
            <Space>
              <Avatar
                src={imgarc[item].src}
                fit="contain"
                style={{ "--size": "1.5rem" }}
              />
              <span>{item.toUpperCase()}</span>
            </Space>
          </CheckList.Item>
        ))}

      </CheckList>
    </div>
  );
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
  const handleClick = () => {
    if (!wallet.account || !wallet.type) {
      return Toast.show(i18next.t("connectPrompt"));
    }
    DialogInstance = Dialog.show({
      content: list,
      closeOnAction: true,
      disableBodyScroll:false,
      maskStyle: { background: "rgba(0,0,0,.85)" },
      bodyStyle: { background: theme.skin === "dark" ? "#2F343D" : "#fff" },
      actions: [
        [
          {
            key: "cancel",
            text: <span style={{ color: "gray" }}>  {i18next.t("cancel")}</span>,
          },
          {
            key: "confirm",
            text: i18next.t("enter"),
          },
        ],
      ],
    });
  };
  const selectorClassName=useMemo(()=>{
    if(theme.skin==="dark"){
      return {
        "currency-selector-dark": true,
      }
    }
    return {
      "currency-selector": true,
    }
  },[theme.skin])
  return (
    <Space
      block
      align="center"
      justify="between"
      className={cx(selectorClassName)}
      onClick={handleClick}
      style={{background:theme.skin==='dark'?"#2C313B":""}}
    >
      <Space align="center" block >
        <Avatar
          src={imgarc[depositState.currency].src ||EthIcon.src}
          fit="contain"
          style={{ "--size": "1.5rem" }}
        />
        <span style={{color:theme.skin==='dark'?"#fff":""}} >{depositState.currency.toUpperCase()}</span>
      </Space>
      <span>
        <RightOutline />
      </span>
    </Space>
  );
}
