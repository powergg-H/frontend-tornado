"use client";
import "./globals.css";
import styles from "@/app/index.module.css";
// import ThemeSwitch from "@/components/Home/ThemeSwitch";
import Wallet from "@/components/Home/Wallet";
import Deposit from "@/components/Home/Deposit";
import VerticalCarousel from "@/components/Home/VerticalCarousel";
// import Promotion from "@/components/Promotion"
import lightImg from "@/public/background.png"
import lightWebpImg from "@/public/background.webp"
import { useRecoilState } from "recoil";
import { themeState } from "@/recoil/theme";
import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { Toast } from "antd-mobile";
import "@/lang/index"
import { walletState } from "@/recoil/wallet";
import { userState } from "@/recoil/user";
import { getLogin } from "@/Api"
import Head from 'next/head'
import { formatString, personalSign } from "@/utils";
import currentInfo from "@/utils/config_index"
import i18next from "i18next";
import dynamic from 'next/dynamic';

const Promotion = dynamic(() => import('@/components/Promotion'), { ssr: false })
// const Wallet = dynamic(() => import('@/components/Home/Wallet'), { ssr: false })
const ThemeSwitch = dynamic(() => import('@/components/Home/ThemeSwitch'), { ssr: false })
// const Deposit = dynamic(() => import('@/components/Home/Deposit'), { ssr: false })
// const VerticalCarousel = dynamic(() => import('@/components/Home/VerticalCarousel'), { ssr: false })
Toast.config({ duration: 3000 })


export default function Home() {
  const [wallet, setWallet] = useRecoilState(walletState);
  const [user, setUser] = useRecoilState(userState);
  const [theme] = useRecoilState(themeState);
  const [showPromotion, setShowPromotion] = useState(false);
  const [height, setHeight] = useState(0)
  const homeBlockRefs = useRef<HTMLDivElement | null>(null)
  useEffect(() => {

    const h = homeBlockRefs.current?.clientHeight;
    setHeight(h || 0)
  }, [])
  const isDark = useMemo(() => {
    return theme.skin === "dark" ? true : false
  }, [theme.skin])
  const isLangeuse = useMemo(() => {
    return theme.language === "en"
  }, [theme.language])
  const setPromotionclass = useMemo(() => {
    if (isDark) {
      switch (theme.language) {
        case "en":
          return "promotion_drak";
        case "tw":
          return "promotion_drak_tw";
        default:
          return "promotion_drak_cn"
      }
    } else {
      switch (theme.language) {
        case "en":
          return "promotion_light";
        case "tw":
          return "promotion_light_tw";
        default:
          return "promotion_light_cn"
      }
    }
  }, [isLangeuse, isDark])

  const handleGo = useCallback(() => {

    setShowPromotion(true)
    
  }, [])
  const hanldeGoWallet = () => {
    setShowPromotion(false)
  }
  const getInitCode=()=>{
      let code=window.location.search.slice(1);
      if(code){
         code=code.split("&")[0]
      }
      if(code.includes("tronlink")){
        code=""
      }
      return code
  }
  //登录
  const handleLogin = async () => {
    if (!wallet.account) return Toast.show({
      icon: "fail",
      content: i18next.t("connectPrompt")
    })

    let account = wallet.account;
    let chainName: "eth" | "tron" = "eth"
    if (wallet.type === "TronLink") {
      if (!(window as any).tronWeb) return
      account = (window as any).tronWeb.address.toHex(account);
      account = "0x" + account.slice(2)
      chainName = "tron"
    }
    //登录
    const timstamp = Date.now()
    const sign = await personalSign({ account, providers: currentInfo.commonProvider, timstamp, type: wallet.type, inviteCode: getInitCode() });
    const response = await getLogin({
      type: "SIGNATURE",
      identifier: account,
      timeStamp: String(timstamp),
      credential: sign ? sign : "",
      chainName,
      inviteCode: getInitCode()
    })
    if (response) {
      setUser(response)
    }
  }
  return (
    <div className={`${isDark ? "home-dark-background" : "screen_light"} home-container`} >
      <Head>
        <title>My page title</title>
      </Head>
      <div className={styles.home} >

        <div
          className={styles.homeBlock}
          ref={homeBlockRefs}

        // style={{ "--gap-vertical": "1rem" ,height:"100%",display:"flex",flexDirection:"column"}}
        >

          {
            showPromotion && <Promotion goback={hanldeGoWallet} login={handleLogin}/>
          }

          <div style={{ display: showPromotion ? "none" : "block" }}>
            <div className={styles['home-wallet']}>
              <div style={{ flex: 1 }}><Wallet theme={theme} /></div>

              <div className={`${styles.moon}`} style={{ flex: 1 }}><ThemeSwitch go={handleGo} login={handleLogin} /></div>
            </div>
            <Deposit />
            <div className={`${setPromotionclass} promotion`} onClick={handleGo}>
              <div className="promotion_main" >
              </div>
            </div>
            <VerticalCarousel />


          </div>

        </div>
      </div>

    </div>



  );
}
