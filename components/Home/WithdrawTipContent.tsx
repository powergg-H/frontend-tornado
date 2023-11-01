import styles from "@/app/home.module.css";
import indexStyles from "@/app/index.module.css";
import { Space, Input, Popover, List, PopoverRef, DotLoading } from "antd-mobile";
import { SetterOrUpdater } from "recoil";
import { IWithdraw } from "@/recoil/withdraw"
import { useEffect } from "react"
import i18next from 'i18next';
import {relayUrl} from "@/service/config"
// import { withdrawStatus } from "@/utils/withdraw/config"
import {
  RightOutline,
  CheckOutline
} from 'antd-mobile-icons'
import { useRef, useState, useImperativeHandle, forwardRef, ForwardRefExoticComponent, PropsWithoutRef, MutableRefObject } from "react"
import Wallet from "./Wallet";
interface IProps {
  noteString: string;
  recipient: string;
  theme: {
    skin: "light" | "dark"
  },
  inputVal: string,
  setInpValHande: (val: string) => void
  setWithdrawState: SetterOrUpdater<IWithdraw>
}
interface relayPropType {
  address: string,
  cost: string
}


export let relayList: relayPropType[] = [
  {
    address: relayUrl,
    cost: "1%"
  }
  // {
  //   address: "http://voretex.cash.io/icfoaaaa",
  //   cost: "999%---不可用"
  // }
]
const WithdrawTipContent: ForwardRefExoticComponent<PropsWithoutRef<any>> = forwardRef((props, ref) => {
  const { theme, setInpValHande, inputVal, setWithdrawState, noteString, recipient, withStatus, wallet } = props;
  const popRefs = useRef<PopoverRef>(null)
  const [addressState, setAddressState] = useState("");
  const [relayAddress, setRelayAddress] = useState(relayList)
  useEffect(() => {
    
  }, [])
  const handleChangerelay = ({ cost, address }: relayPropType) => {
    //更新当前选中的地址
    let newAddress, inpValue, relay;
    //1.点击了被勾中的相同地址 需要反选
    if (addressState !== "" && address === addressState) {
      newAddress = ""
      inpValue = ""
      relay = {
        cost: "",
        address: ""
      }
    } else {//选中
      newAddress = address;
      inpValue = `${i18next.t("relay.cost")}${cost};${i18next.t("relay.address")}：${address}`
      relay = {
        cost,
        address
      }
    }
    setAddressState(newAddress)
    //跟新输入框文字
    setInpValHande(inpValue)
    //更新钱包信息
    setWithdrawState({
      noteString,
      recipient,
      relay
    })
    popRefs.current?.hide()

  }
  //清除地址选中状态
  const clearAddressFlag = () => {
    setAddressState("")
  }
  // 暴露的方法
  useImperativeHandle(ref, () => ({
    clearAddressFlag
  }), [])
  return (
    <>
      <Space block className={styles.title} justify="center">
        {i18next.t("withdrawTitle")}
      </Space>
      <Space block direction="vertical" style={{ gap: "1rem" }}>
        <Space block direction="vertical">
          <h3 className={styles.title}>{i18next.t("noteing")}</h3>
          <div style={{
            background: theme.skin === 'dark' ? "#535B69" : "#F7F8FA",
            paddingRight: "20px",
            borderRadius: "1.5rem",
            height: "2.5rem",
            border: "1px solid rgba(0,0,0,0.2)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}>
            <Space
              block
              align="center"
              style={{

                padding: ".5rem 1rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {props.noteString}
            </Space>
          </div>

        </Space>
        <Space block direction="vertical">
          <h3 className={styles.title}>{i18next.t("address")}</h3>
          <div style={{
            background: theme.skin === 'dark' ? "#535B69" : "#F7F8FA",
            paddingRight: "20px",
            borderRadius: "1.5rem",
            height: "2.5rem",
            border: "1px solid rgba(0,0,0,0.2)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}>
            <Space
              block
              align="center"
              style={{
                padding: ".5rem 1rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {props.recipient}
            </Space>
          </div>
        </Space>
        <Space block direction="vertical" >
          <h3 className={styles.title} style={{ gap: "1rem" }}>Relay {i18next.t("relay.address")}</h3>
          <Popover
            ref={popRefs}
            mode={theme.skin}

            content={
              <List >
                {
                  relayAddress.map((item, index) => (
                    <List.Item key={index} description={`${i18next.t("relay.address")}:${item.address}`} onClick={() => { handleChangerelay(item) }} arrow={<div className={styles.icon_address}>{addressState === item.address ? <CheckOutline color="#31b7d3" /> : null}</div>}>
                      {i18next.t("relay.cost")}：{item.cost}
                    </List.Item>
                  ))
                }


              </List>
            }
            trigger='click'
            placement='bottom'
          // defaultVisible
          >
            <div className={styles.relay_click} style={{
              background: theme.skin === 'dark' ? "#535B69" : "#F7F8FA",
              borderRadius: "1.5rem",
              padding: ".5rem 1rem",
              boxSizing: "border-box",
              height: "2.5rem",
              border: "1px solid rgba(0,0,0,0.2)",

            }}>

              <Input
                className={theme.skin === 'dark' ? indexStyles['font-drak'] : ""}
                value={inputVal}
                placeholder={i18next.t("placeholder")}
                readOnly
                style={{ paddingRight: "5px" }}

              />
              <span className={styles.outlin_right}><RightOutline></RightOutline></span>
            </div>
          </Popover>
        </Space>
        <div className="withDraw_len" style={{ display: withStatus === -1 ? "none" : "flex" }}>


          <span>
            {
              i18next.t(`withdrawstatus${withStatus}`)

            }<DotLoading color='currentColor' />
          </span>

          <span style={{ display: withStatus === 6 && wallet.type === "WalletConnect" ? "block" : "none" ,color:"rgb(223, 187, 187)"}}>
            {i18next.t("withdrawstatus6.remak")}
          </span>


        </div>
      </Space>
    </>
  );
});
WithdrawTipContent.displayName = 'WithdrawTipContent';
export default WithdrawTipContent;
