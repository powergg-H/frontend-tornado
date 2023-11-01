"use client";

import { Space, Avatar, Input } from "antd-mobile";
import styles from "./home.module.css";
import AmountSlider from "./AmountSlider";
import DirectionIcon from "@/public/direction@2x.png";
import Dollar from "@/public/dollar@2x.png";
import Eth from "@/public/eth@3x.png";
import { useRecoilState } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import i18next from 'i18next';
import { themeState, ThemeImgType } from "@/recoil/theme";
import { useState, useMemo, useEffect } from "react"



export default function ExchangeGasContent() {
  const [depositState, setDepositState] = useRecoilState(deposit);
  const [theme, setTheme] = useRecoilState(themeState);
  const { exchange: exchangeState } = depositState;
  const { usdc, eth, propo, gasPrice, limit } = exchangeState;

 
  const getGasAmountEth=useMemo(()=>{
      return gasPrice * limit / Math.pow(10, 18)
  },[gasPrice,limit])
  const getGasAmout=useMemo(()=>{
    getGasAmountEth*propo+usdc * 0.01
  },[gasPrice,limit,usdc,propo,getGasAmountEth])
  const getEth = useMemo(() => {
    return (usdc - usdc * 0.01) * propo - (getGasAmountEth)
  }, [usdc, propo, gasPrice, limit,getGasAmountEth])

  return (
    <>
      <Space block direction="vertical" style={{ gap: "1rem" }}>
        <Space block justify="center" className={theme.skin === "dark" ? styles['title-dark'] : styles.title}>
          {i18next.t("gas.insufficient")}
        </Space>
        <Space block direction="vertical" className={styles.exchangeInputBox}>
          <div className={theme.skin === "dark" ? styles['item-dark'] : styles.item}>
            <Space block justify="between" align="center">
              <Avatar
                src={Dollar.src}
                fit="contain"
                style={{ "--size": "2rem" }}
              />
              <Space align="center">
                <span style={{}}>
                  <Input
                    placeholder=""
                    value={String(usdc)}
                    onChange={(v) => {
                      if (Number(v) > 1000 || Number(v) < 1) return
                      setDepositState({
                        ...depositState,
                        exchange: {
                          ...exchangeState,
                          usdc: Number(v),
                        },
                      });
                    }}
                    
                    className={theme.skin === "dark" ? styles['inputNumber-dark'] : styles.inputNumber}
                    type="number"
                    min={1}
                    max={1000}
                  />
                </span>
                <span style={{ color: theme.skin === "dark" ? "#fff" : "#666" }}>USDC</span>
              </Space>
            </Space>
          </div>
          <div className={theme.skin === "dark" ? styles['item-dark'] : styles.item}>
            <Space block justify="between" align="center">
              <Avatar
                src={Eth.src}
                fit="contain"
                style={{ "--size": "2rem" }}
              />
              <Space>
                <span>≈</span>
                <span>{Number(getEth).toFixed(6)}</span>
                <span style={{ color: theme.skin === "dark" ? "#fff" : "#666" }}>ETH</span>
              </Space>
            </Space>
          </div>
          <div className={theme.skin === "dark" ? styles['direction-dark'] : styles.direction}>
            <Avatar
              src={DirectionIcon.src}
              fit="contain"
              style={{ "--size": "1rem" }}
            />
          </div>
        </Space>
        <AmountSlider />
      </Space>
    </>
  );
}
