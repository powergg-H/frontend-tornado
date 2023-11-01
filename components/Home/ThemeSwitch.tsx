"use client";
import i18next from 'i18next';
import { Popup, Divider, CapsuleTabs } from "antd-mobile";
import { useRecoilState } from "recoil";
import { themeState } from "@/recoil/theme";
import { useState, useCallback, useMemo } from "react"
import styles from "./home.module.css"
import { walletState } from "@/recoil/wallet";
import { userState } from "@/recoil/user";
import {local} from "@/utils"
import { UserOutline, PlayOutline, SetOutline, FolderOutline, GlobalOutline, AntOutline, UploadOutline, InformationCircleOutline } from "antd-mobile-icons";
interface ThemeSwitchProps {
  go: () => void
  login: () => void
}
export default function ThemeSwitch(props: ThemeSwitchProps) {
  const { go, login } = props
  const [wallet, setWallet] = useRecoilState(walletState);
  const [user, setUser] = useRecoilState(userState);
  const [theme, setTheme] = useRecoilState(themeState);
  const [visible, setVisible] = useState(false)
  const [skinState, setSkinState] = useState("light")
  const handleSwitch = useCallback(() => {
    theme.skin === "light" ? setDrakColor() : setLightColor()
  }, [theme.skin]);


  const setDrakColor = () => {
    document.documentElement.setAttribute(
      'data-prefers-color-scheme',
      'dark'
    )
    const rootDiv = document.querySelector("body>div")
    const innerDiv = document.querySelector("#inner_light_drak")
    rootDiv?.classList.remove("screen_light")
    rootDiv?.classList.add("screen_drak")
    innerDiv?.classList.add("screen_inner_drak")

  }

  const setLightColor = () => {
    document.documentElement.setAttribute(
      'data-prefers-color-scheme',
      ''
    )
    const rootDiv = document.querySelector("body>div")
    const innerDiv = document.querySelector("#inner_light_drak")
    rootDiv?.classList.remove("screen_drak")
    rootDiv?.classList.add("screen_light")
    innerDiv?.classList.remove("screen_inner_drak")


  }
  //选择皮肤
  const handleChangeSkin = (value: string) => {
    setTheme({
      ...theme,
      skin: value as "dark" | "light"
    })
    setSkinState(value)
    handleSwitch()
  }
  //选择语言
  const handleChangeLang = (value: string) => {
    if (value === "en" || value === "zh" || value === "tw") {
      i18next.changeLanguage(value)
      setTheme({
        ...theme,
        language: value
      })
    }
  }
  const handleClose = () => {

    setVisible(false)

  }
  const handleSetConfig = () => {
    setVisible(true)
  }
  const getUser = useMemo(() => {
    const {inviteCode} =user;
    if (wallet.account && local.get("token")) {
      return wallet.account.slice(0, 4) + "..." + wallet.account.slice(-4)
    }
    return i18next.t("login")
  }, [user,wallet,theme])
  return (
    <div style={{ cursor: "pointer" }} onClick={() => handleSetConfig()} >
      <SetOutline style={{ fontSize: "2rem", color: "#fff" }} />
      <Popup
        position='right'
        visible={visible}
        showCloseButton
        closeOnMaskClick
        onClose={handleClose}
        className='home-modal-lang'
        bodyStyle={{ padding: "5%" ,background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
  
      >
        <div className={styles.config_modal}>
          <div className={`${styles.config_list} ${styles.user}`} onClick={login} >
            <div>
              <UserOutline /><span>{getUser}</span>
            </div>
            <PlayOutline style={{ cursor: "pointer",display:getUser===i18next.t('login')?"":"none" }} />

          </div>
          <div className={`${styles.config_list} ${styles.user}`} onClick={()=>{setVisible(false);go()}} >
            <div>
              <FolderOutline /><span>{i18next.t("promotion")}</span>
            </div>
            <PlayOutline style={{ cursor: "pointer" }} />
          </div>
          <div className={styles.config_list_space_box}>
            <ol className='lang-div'>
              <GlobalOutline />
              <span>{i18next.t("lang")}</span>

            </ol>

            <CapsuleTabs onChange={handleChangeLang} defaultActiveKey="en" className={theme.skin === "dark" ? "capsuleTabs-class-dark" : ""}>
              <CapsuleTabs.Tab title='简体中文' key='zh'></CapsuleTabs.Tab>
              <CapsuleTabs.Tab title='繁體中文' key='tw'></CapsuleTabs.Tab>
              <CapsuleTabs.Tab title='English' key='en'></CapsuleTabs.Tab>
            </CapsuleTabs>

          </div>
          <div className={styles.config_list_space_box}>
            <ol className='lang-div'>
              <AntOutline />
              <span>{i18next.t("theme")}</span>

            </ol>
            <div className={styles.config_list_space_them}>
              <CapsuleTabs onChange={handleChangeSkin} defaultActiveKey={skinState} className={theme.skin === "dark" ? "capsuleTabs-class-dark" : ""}>
                <CapsuleTabs.Tab title={i18next.t("white")} key='light'></CapsuleTabs.Tab>
                <CapsuleTabs.Tab title={i18next.t("black")} key='dark'></CapsuleTabs.Tab>

              </CapsuleTabs>
            </div>
          </div>

          <div className={`${styles.config_list} ${styles.user}`}>
            <div>
              <InformationCircleOutline /> <span>{i18next.t("version")}</span>
            </div>
            <span style={{ paddingRight: "2%" }}>v1.2</span>

          </div>
          {/* <div className={`${styles.config_list} ${styles.user}`}>
            <div>
            <UploadOutline /> <span>退出登录</span>
            </div>
          
          </div> */}
        </div>
      </Popup>
    </div>

  );
}
