import styles from "@/app/home.module.css";
import { Space, Avatar } from "antd-mobile";
import MetaMaskIcon from "@/public/metamask.png";
import {ThemePropsType} from "@/recoil/theme"
import i18next from 'i18next';
import {useMemo} from "react"
import {ConnectedIcon} from "@/components/Home/Wallet"
interface IProps {
  account: string;
  amount: number;
  type: string;
  currency:string;
  theme:ThemePropsType
}

const DepositTipContent: React.FC<IProps> = (props) => {
  const {theme} =props;
 const {currency,amount,account,type} =props;

 const formatAccount=useMemo(()=>{
      if(!account) return "";
      return account.slice(0,4)+"..."+account.slice(-4)
      
       
 },[account])
  return (
    <>
      <Space block className={styles.title}>
        {i18next.t("will")}
      </Space>
      <Space
        block
        direction="vertical"
        style={{
          background: theme.skin==="dark"?"#414852":"rgba(187,255,255,.2)",
          borderRadius: ".75rem",
          padding: "1rem",
        }}
      >
        <Space block>
          <Avatar
            src={ConnectedIcon[type].src}
            fit="contain"
            style={{ "--size": "1.5rem" }}
          />
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "10rem",
              
            }}
          >
            {formatAccount}
          </span>
        </Space>
        <Space block>
          <span>{i18next.t("save")}:</span>
          <span>{amount} {currency.toUpperCase()}</span>
        </Space>
      </Space>
    </>
  );
};

export default DepositTipContent;
