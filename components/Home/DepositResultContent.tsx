import styles from "@/app/home.module.css";
import { Space, Avatar, Card, Button, Toast, Grid } from "antd-mobile";
import { CollectMoneyOutline } from "antd-mobile-icons";
import { ThemePropsType } from "@/recoil/theme"
import i18next from 'i18next';
import { local } from "@/utils"
import {useEffect} from "react"
import {copyCot} from "@/utils"
interface IProps {
  noteString: string;
  theme: ThemePropsType
}

const DepositTipContent: React.FC<IProps> = (props) => {
  const { theme } = props
  return (
    <>
      <Space block justify="center" className={styles.title}>
        {i18next.t("depositStatus")}
      </Space>
      <Space block direction="vertical">
        <h3>{i18next.t("noteing.deposit")}</h3>
        <Space
          block
          justify="between"
          style={{
            background: theme.skin === "dark" ? "#535B69 " : "#F5F7FA",
            borderRadius: "1.5rem",
            padding: ".5rem .75rem",
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          <span
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "15rem",
              display: "block",
            }}
          >
            {props.noteString}
          </span>
          <CollectMoneyOutline
            id="copy"
            data-clipboard-target="#foo"
            onClick={() => {
              copyCot(props.noteString)
              local.set("noteString", props.noteString);
              Toast.show(i18next.t("copy.success"));
            }}
          />
        </Space>
      </Space>

    </>
  );
};

export default DepositTipContent;
