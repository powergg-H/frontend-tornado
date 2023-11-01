"use client";

import { Dialog, Result, Toast } from "antd-mobile";
import ExchangeGasContent from "./ExchangeGasContent";
import { useRecoilState } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import i18next from 'i18next';
import { themeState, ThemeImgType } from "@/recoil/theme";
import changeGas from "@/utils/deposit/nogas"
import changeGasTrx from "@/utils/deposit/nogas_trx"
import { walletState } from "@/recoil/wallet";
import { relayList } from "@/components/Home/WithdrawTipContent"
import { useState, useMemo, useEffect } from "react"
import currentInfo from "@/utils/config_index"


interface ExchangeGasPropsType {
  setButtonLoading: (v:boolean) => void
}

export default function ExchangeGas(props: ExchangeGasPropsType) {
  const { setButtonLoading } = props
  const [depositState, setDepositState] = useRecoilState(deposit);
  const { exchange: exchangeState } = depositState;
  const [theme, setTheme] = useRecoilState(themeState);
  const [wallet, setWallet] = useRecoilState(walletState);
  const { usdc, eth, propo, gasPrice, limit } = exchangeState;
  const exchangeTipContent = <Result status="success" title={i18next.t("exchange.success")} />;

  //获取gasAmountEth
  const getGasAmountEth = useMemo(() => {
    return (gasPrice * limit) / (Math.pow(10, 18))
  }, [gasPrice, limit])
  //获取gasAmount
  const getGasAmout = useMemo(() => {
    return (getGasAmountEth / propo) + (usdc * 0.01)
  }, [gasPrice, limit, usdc, propo, getGasAmountEth])
  const getEth = useMemo(() => {
    return (usdc - usdc * 0.01) * propo - (getGasAmountEth)
  }, [usdc, propo, gasPrice, limit, getGasAmountEth])
  const handleExchangeSuccess = async () => {
    try {
      switch (wallet.type) {
        case "TronLink":
          break;
        default:
          const { netId } = currentInfo;
          await changeGas({ netId, address: wallet.account, relayAddress: relayList[0].address, tokens: usdc, gasAmountNum: getGasAmout, ethMinLimit: getEth, provider: currentInfo.providers });
          break;
      }
      Dialog.alert({
        content: exchangeTipContent,
        confirmText: i18next.t("enter"),
      });
    } catch (error) {

      Toast.show({
        maskStyle: { background: "rgba(0,0,0,.85)" },
        icon: "fail",
        content: i18next.t("fail3"),
      })
    }
  };

  return (
    <Dialog
      className="gas-dialog"
      visible={exchangeState.isShowDialog}
      content={<ExchangeGasContent />}
      closeOnAction
      destroyOnClose
      disableBodyScroll={false}
      maskStyle={{ background: "rgba(0,0,0,.85)" }}
      bodyStyle={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
      onClose={() => {
        setDepositState({
          ...depositState,
          exchange: { ...exchangeState, isShowDialog: false },
        });
        setButtonLoading(false)
      }}
      actions={[
        [
          {
            key: "cancel",
            text: <span style={{ color: "gray" }}>{i18next.t("cancel.deposit")}</span>,
          },
          {
            key: "confirm",
            text: i18next.t("exchange"),
            onClick: handleExchangeSuccess,
          },
        ],
      ]}
    />
  );
}
