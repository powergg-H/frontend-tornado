import { Space, Button, Input, Toast, Dialog, Result, Dropdown, Popover, List,DotLoading,Modal } from "antd-mobile";
import styles from "@/app/index.module.css";
import { useRecoilState, useRecoilValue, SetterOrUpdater } from "recoil";
import { withdraw as widthdrawRecoil } from "@/recoil/withdraw";
import { withdraw } from "@/utils/withdraw";
import { themeState } from "@/recoil/theme";
import i18next from 'i18next';
import { withdrawTronLink } from "@/utils/withdraw/tronLink";
import { walletState as walletRecoil } from "@/recoil/wallet";
import WithdrawTipContent from "./WithdrawTipContent";
import { depositState as deposit } from "@/recoil/deposit";
import React, { useState, useRef, useEffect } from "react"
import currentInfo from "@/utils/config_index"
// import { withdrawStatus } from "@/utils/withdraw/config"
interface DialogPropsHandleType {
  clearAddressFlag: () => void
}

export default function WithDrawTabContent() {
  const [withdrawState, setWithdrawState] = useRecoilState(widthdrawRecoil);
  const [depositState] = useRecoilState(deposit);
  const { currency, amount } = depositState
  const wallet = useRecoilValue(walletRecoil);
  const { noteString, recipient, relay } = withdrawState;
  const [theme, setTheme] = useRecoilState(themeState);
  const [inputVal, setInputVal] = useState("")
  const [dialogVisible, setDialogVisible] = useState(false) //弹窗状态
  const dialogRef = useRef<DialogPropsHandleType>()
  const [withStatus, setWithdrawStatus] = useState(-1)
  useEffect(() => {
    currentInfo.setWithdrawStatus = setWithdrawStatus
    getJsonBuffer()
  }, [])
  const getJsonBuffer=async()=>{
    
  }
  const handleWithdraw = async () => {
    if (!wallet.account || !wallet.type) {
      return Toast.show(i18next.t("connectPrompt"));
    }

    if (!noteString || noteString.length < 32) {
      return Toast.show(i18next.t("noteing.info"));
    }

    if (!recipient) {
      return Toast.show(i18next.t("noteing.address"));
    }
    setDialogVisible(true)
    setWithdrawStatus(-1)
   
  };
  //重置钱包数据
  const resetWithdrawState = () => {
    setWithdrawState({
      ...withdrawState,
      noteString: "",
      recipient: "",
      relay: {
        address: "",
        cost: ""
      }
    })
    setInputVal("")
    setDialogVisible(false)
    dialogRef.current?.clearAddressFlag()
  }
  const showDepositResult = () => {
    resetWithdrawState()
    const exchangeTipContent = <Result status="success" title={i18next.t("withdrawStatus")} style={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }} />;
    Dialog.alert({
      content: exchangeTipContent,
      maskStyle: { background: "rgba(0,0,0,.85)" },
      bodyStyle: { background: theme.skin === "dark" ? "#2F343D" : "#fff" },
      confirmText: i18next.t("enter"),
    });
  };
  const setInpValHande = (val: string) => {
    setInputVal(val)
  }
  const handleAction = async (value: any) => {
    if (value.key === "cancel") {
      setDialogVisible(false)
      setInputVal("")
      // resetWithdrawState()
      return
    }

   
    try {

      let tx;
      switch (wallet.type) {
        case "MetaMask":
          tx = await withdraw({ noteString, recipient, relay, account: wallet.account, build16: currentInfo.build16 });
          break;
        case "TronLink":
          tx = await withdrawTronLink({ noteString, recipient, relay, build16: currentInfo.build16 });
          break;
        case "WalletConnect":
          tx = await withdraw({ noteString, recipient, relay, account: wallet.account, build16: currentInfo.build16 });
         
          break;
      }
      setWithdrawStatus(-1)
      showDepositResult();
    } catch (error: any) {
      setWithdrawStatus(-1)
      if (error.message) {
        Toast.show({
          maskStyle: { background: "rgba(0,0,0,.85)" },
          icon: "fail",
          content: error.message,
        })
        return
      }

      Toast.show({
        maskStyle: { background: "rgba(0,0,0,.85)" },
        icon: "fail",
        content: String(error),
      })
    }
  }
  return (
    <>
     <Space block direction="vertical" style={{ "--gap": "19.3px" }} className={`${styles['inner-withdraw']} inner-withdraw`}>
      <h3 className={styles.title}>{i18next.t("noteing")}</h3>
      <Space block direction="vertical">
        <Input
          className={theme.skin === 'dark' ? styles['font-drak'] : ""}
          value={noteString}
          placeholder={i18next.t("noteinged")}
          style={{
            background: theme.skin === 'dark' ? "#2C313B" : "#E9ECF2",
            borderRadius: "1.5rem",
            padding: ".5rem 1rem",
            boxSizing: "border-box",
          }}
          onChange={(v) => {
            setWithdrawState({
              ...withdrawState,
              noteString: v,
            });
          }}
        />
      </Space>
      <Space block direction="vertical">
        <h3 className={styles.title}>{i18next.t("address")}</h3>
        <Input
          className={theme.skin === 'dark' ? styles['font-drak'] : ""}
          value={recipient}
          placeholder={i18next.t("addressed")}
          style={{
            background: theme.skin === 'dark' ? "#2C313B" : "#E9ECF2",
            borderRadius: "1.5rem",
            padding: ".5rem 1rem",
            boxSizing: "border-box",
          }}
          onChange={(v) => {
            setWithdrawState({
              ...withdrawState,
              recipient: v,
            });
          }}
        />
      </Space>
      <h2 style={{ overflow: "visible" }}></h2>
      <Button
        onClick={handleWithdraw}
        block
        color="primary"
        style={{ borderRadius: "1.5rem", marginTop: "1.6rem" }}
        size="large"
      >
        {i18next.t("extract")}
      </Button>
      <Dialog
        className="relay_box"
        visible={dialogVisible}
        maskStyle={{ background: "rgba(0,0,0,.85)" }}
        bodyStyle={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
        content={<WithdrawTipContent {...{wallet, noteString, recipient, theme, inputVal, setInpValHande, setWithdrawState, withStatus }} ref={dialogRef} />}
        destroyOnClose={true}
        actions={[
          {
            key: 'cancel',
            text: i18next.t("cancel.deposit"),
            style: {
              borderRadius: "22px"
            }
          },
          {
            key: 'enter',
            text: i18next.t("enter.withdraw"),
            style: {
              background: "#31b7d3",
              color: "#fff",
              borderRadius: "22px"
            }
          }
        ]}
        onAction={handleAction}
      />
      
    </Space>
    </>
  );
}
