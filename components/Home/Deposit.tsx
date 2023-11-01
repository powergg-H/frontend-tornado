
import { Button, Space, Image, Toast, Dialog, Card } from "antd-mobile";
import styles from "@/app/index.module.css";
import AmountSelector from "./AmountSelector";
import CurrencySelector from "./CurrencySelector";
import DepositTipContent from "./DepositTipContent";
import DepositResultContent from "./DepositResultContent";
import { withdraw as widthdrawRecoil } from "@/recoil/withdraw";
import ExchangeGas from "./ExchangeGas";
import { walletState } from "@/recoil/wallet";
import { startDepositMetamask, startDepositTronLink } from "@/utils/deposit";
import WithDrawTabContent from "./WithDrawTabContent";
import { useRecoilState, useRecoilValue } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import { useRef, useMemo, useEffect, useState ,useImperativeHandle} from "react"
import { themeState, ThemeImgType } from "@/recoil/theme";
import i18next from 'i18next';
import { local } from "@/utils"
import { copyCot } from "@/utils"
interface AmountSelectorRefProps {
  setCurrent: () => void
}
export default function Deposit() {

  const [depositState, setDepositState] = useRecoilState(deposit);
  const [withdrawState, setWithdrawState] = useRecoilState(widthdrawRecoil);
  const [theme, setTheme] = useRecoilState(themeState);
  const { amount, exchange: exchangeState, currency } = depositState;
  const [depositLoading, setDepositLoading] = useState(false)
  // const [isEnoughGas, setIsEnoughGas] = useState(true)
  const wallet = useRecoilValue(walletState);
  const amountSelectorRefs = useRef<AmountSelectorRefProps>()
  const themeImg: ThemeImgType = {
    "dark": {
      tw: {
        deposit: "tab-title1-drak",
        withdraw: "tab-title2-drak"
      },
      zh: {
        deposit: "tab-title1-drak",
        withdraw: "tab-title2-drak"
      },
      en: {
        deposit: "en-tab-title1-drak",
        withdraw: "en-tab-title2-drak"
      }
    },
    "light": {
      tw: {
        deposit: "tab-title1",
        withdraw: "tab-title2"
      },
      zh: {
        deposit: "tab-title1",
        withdraw: "tab-title2"
      },
      en: {
        deposit: "en-tab-title1",
        withdraw: "en-tab-title2"
      }
    }
  }
  const imgSrc1 = useMemo(() => {
    const className = themeImg[theme.skin][theme.language]

    return styles[className[depositState.currentTab]]
  }, [depositState.currentTab, theme, themeImg])
  const handleExchangeGas = () => {
    setDepositState({
      ...depositState,
      exchange: { ...exchangeState, isShowDialog: true },
    });
  };
  const handleDeposit = async () => {
    // handleExchangeGas();
    if (!wallet.account || !wallet.type) {
      return Toast.show(i18next.t("connectPrompt"));
    }
    if (depositState.currentTab === "deposit") {
      setDepositLoading(true)
      try {
        if (wallet.type !== "TronLink") {
          const isEnoughGas = await getIsGas(amount, "MateMask");
         
          if (!isEnoughGas) {
              handleExchangeGas()
            return
          }
        }
        setDepositLoading(false)
      } catch (error) {
        Toast.show({
          icon: "fail",
          content: String(error)
        })
        setDepositLoading(false)
      }
      showDepositTip();
    }
  };
  //计算燃料费用是否足够
  const getIsGas = async (num: number, value: string) => {
    const { exchange } = depositState;
    let balance = 0;
    let isEnough = false;
    switch (value) {
      case "TronLink":
        break;
      default:
        const web = (window as any).web3
        balance = await web.eth.getBalance(wallet.account)
        balance = web.utils.fromWei(balance, 'ether')
        const { gasPrice, limit } = exchange

        const n = Number(gasPrice) * limit / Math.pow(10, 18);
        console.log(balance)
        console.log(n)
        if(depositState.currency==="eth"){
          isEnough = num + n < balance;
        }else{
          isEnough =n < balance;
        }

       
        break;
    }
    return isEnough
  }
  const showDepositTip = async () => {
    const childProps = {
      ...wallet,
      ...depositState,
      theme
    }
    Dialog.confirm({
      content: <DepositTipContent {...childProps} />,
      cancelText: i18next.t("cancel.deposit"),
      confirmText: i18next.t("enter.deposit"),
      maskStyle: { background: "rgba(0,0,0,.85)" },
      bodyStyle: { background: theme.skin === "dark" ? "#2F343D" : "#fff" },
      onConfirm: async () => {
        let note;
        try {
          switch (wallet.type) {
            case "MetaMask":
              note = await startDepositMetamask({ amount, account: wallet.account, currency });
              break;
            case "TronLink":
              note = await startDepositTronLink({ amount, account: wallet.account, currency });
              break;
            case "WalletConnect":
              note = await startDepositMetamask({ amount, account: wallet.account, currency });
              break;
          }

        } catch (error: any) {
       
          setDepositLoading(false)
          if (error.message) {
            if (error.message === "Contract validate error : Validate InternalTransfer error, balance is not sufficient.") {
              error.message = i18next.t("balance")
            } else {
              error.message = i18next.t("fail3")
            }
            Toast.show({
              icon: "fail",
              content: error.message
            })
          } else {

            Toast.show({
              icon: "fail",
              content: i18next.t("fail3")
            })
          }
        }
        if (note) {
          setDepositLoading(false)
          showDepositResult({ note });
          downloadFile(note)

        }

      },
    });
  };

  const downloadFile = (note: string) => {
    if (!note) return
    const blob = new Blob([note], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = getDate() + ".txt";

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  }
  const getDate = () => {
    const date = new Date();
    const year = date.getFullYear();             //获取年 
    const month = date.getMonth() + 1;               //获取月  
    const day = date.getDate();                 //获取当日
    let hours = String(date.getHours());               //获取小时
    let minutes = String(date.getMinutes());           //获取分钟
    let seconds = String(date.getSeconds());
    hours = hours.length > 1 ? hours : "0" + hours
    minutes = minutes.length > 1 ? minutes : "0" + minutes
    seconds = seconds.length > 1 ? seconds : "0" + seconds
    return `${year}-${month}-${day} ${hours}：${minutes}：${seconds}`

  }
  const showDepositResult = ({ note }: { note: string }) => {
    Dialog.alert({
      content: <DepositResultContent noteString={note} theme={theme} />,
      confirmText: <span className="copyEle">{i18next.t("enter")}</span>,
      maskStyle: { background: "rgba(0,0,0,.85)" },
      bodyStyle: { background: theme.skin === "dark" ? "#2F343D" : "#fff" },
      onConfirm: () => {
        copyCot(note)
        local.set("noteString", note);

      },
    });
  };

  const handleChangeTab = (tab: any) => {
    setDepositState({
      ...depositState,
      currentTab: tab,
      amount:depositState.amountList.length?depositState.amountList[0]:0
    });
    setWithdrawState({
      ...withdrawState,
      noteString: "",
      recipient: "",
      relay: {
        cost: "",
        address: ""
      }
    })
  };
  const handleSetCurrent = useMemo(() => {
    return amountSelectorRefs.current?.setCurrent
  }, [amountSelectorRefs])
  const text = depositState.currentTab === "deposit" ? i18next.t("tabTitle") : i18next.t("tabTitle1");
  return (
    <div className={`${styles.deposit}`}>
      <div className={`${styles["tab-title"]} ${imgSrc1}`}>

        <ul className={styles["tab-title-menu"]}>
          <li
            className={styles.item}
            onClick={() => handleChangeTab("deposit")}
          >
            deposit
          </li>
          <li
            className={styles.item}
            onClick={() => handleChangeTab("withdraw")}
          >
            withdraw
          </li>
        </ul>
      </div>

      <div className={styles.inner} id="inner_light_drak">
        {depositState.currentTab === "deposit" ? (
          <Space
            {...{
              block: true,
              direction: "vertical",
              style: { "--gap": "23.8px" },
            }}
          >
            <h3 className={styles.title} >{i18next.t("tokens")}</h3>
            <CurrencySelector handleSetCurrent={handleSetCurrent} />
            <h3 className={styles.title}>{i18next.t("amount")}</h3>
            <AmountSelector ref={amountSelectorRefs} />
            <Button
              onClick={handleDeposit}
              loading={depositLoading}
              block
              color="primary"
              style={{ borderRadius: "1.5rem" }}
              size="large"
            >
              {text}
              {amount} {depositState.currency.toUpperCase()}
            </Button>
          </Space>
        ) : (
          <WithDrawTabContent />
        )}
      </div>

      <ExchangeGas setButtonLoading={setDepositLoading}/>
    </div>
  );
}
