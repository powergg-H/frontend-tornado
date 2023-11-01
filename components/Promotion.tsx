/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-08-06 17:31:00
 * @LastEditTime : 2023-08-18 20:45:04
 * @FilePath     : Promotion.tsx
 */
import { LeftOutline } from "antd-mobile-icons";
import { Button, Tabs, Dialog, Space, Input, Slider, Toast } from "antd-mobile";
import { useState, useEffect, useMemo } from "react";
import { useRecoilState } from "recoil";
import { getDetail, getHistory, getWithdraw } from "@/Api"
import { userState } from "@/recoil/user";
import { themeState } from "@/recoil/theme";
import i18next from 'i18next';
import styles from "@/app/home.module.css";
import "@/app/promotion.css"
import { local } from "@/utils"
import { copyCot } from "@/utils"
interface PropsTypes {
    goback: () => void
    login: () => void
    style?: Record<string, string>
}


const statusMap = new Map([
    [0, i18next.t('status0')],
    [1, i18next.t('status1')],
    [2, i18next.t('status2')],
    [3, i18next.t('status3')],
])

const Promotion = (props: PropsTypes) => {

    const [user, setUser] = useRecoilState(userState);
    const [theme, setTheme] = useRecoilState(themeState);
    const [detailData, setDetailList] = useState<any>({ ipage: {} })
    const [historyData, setHistoryList] = useState<any>({ ipage: {} })
    const [formValue, setFormValues] = useState<any>({ address: "", amount: "50" })
    const [dialogVisible, setDialogVisible] = useState<boolean>(false)
    const { goback, login, style } = props;
    useEffect(() => {

        handleChangeTab("detail")
    }, [])

    const handleGetDetail = async () => {
        const res = await getDetail({
            pageNum: 0,
            pageSize: 100000,
        })
        if (res) {
          
            setDetailList(res)
        }
    }

    const handleGetHistory = async () => {
        const res = await getHistory({
            pageNum: 0,
            pageSize: 100000,
        })
        if (res) {

            setHistoryList(res)
        }
    }
    //体现按钮
    const handleWithdraw = async () => {
        if (!getCode) {
            Toast.show(i18next.t("login1"))
            return
        }
        if (Number(detailData.totalAmount) < 50) {
            Toast.show(i18next.t("button2"))
            return
        }
        setFormValues({ address: "", amount: "50" })
        setDialogVisible(true)
    }
    const handleSetAmount = (v: string) => {
        setFormValues({
            ...formValue,
            amount: Number(v)
        })
    }

    const handleSetAddress = (v: string) => {
        setFormValues({
            ...formValue,
            address: v
        })
    }
    const handleAction = async ({ key }: any) => {

        if (key === "cancel") {
            setDialogVisible(false)
            return
        }
        //提现
        if (!formValue.address || !formValue.amount) {
            Toast.show({
                icon: "fail",
                content: i18next.t("content1")
            })

            return
        }
        if (formValue.address) {
            if (formValue.address[0] !== "T") {
                Toast.show({
                    icon: "fail",
                    content: i18next.t("content3")
                })
                return
            }
        }
        const res = await getWithdraw(formValue);
        const { code } = res;
        if (code === "00000") {
            Toast.show({
                icon: "success",
                content: i18next.t("success1")
            })
            handleGetHistory()
            handleGetDetail()
            setDialogVisible(false)
            return
        }
        Toast.show({
            icon: "fail",
            content: i18next.t("fail1")
        })
    }
    const getLevelLang = (level: number) => {
        switch (theme.language) {
            case "zh":
                return level + " 级";
            case "tw":
                return level + " 級";
            default:
                return "Level " + level;
        }
    }
    //渲染收入明细
    const renderDetail = useMemo(() => {
        const { ipage: { records = [] } } = detailData;

        return (records.map((item: any) => (<div key={item.id} className="content_box">
            <div className="content1">{item.id}</div>
            <div className="content2">{getLevelLang(item.level)}</div>
            <div className="content3">{item.income}U</div>
        </div>)))
    }, [detailData, getLevelLang])

    const getColor = (status: number) => {
        switch (status) {
            case 0:
                return "orange";
            case 1:
                return "green"
            case 2:
                return "red"
        }
    }
    //渲染体现历史
    const renderHistory = useMemo(() => {
        const { ipage: { records = [] } } = historyData;
        return (records.map((item: any) => (<div key={item.id} className="history_box">
            <div className="history1">
                <b>{item.id}</b>
                <span>{item.createTime}</span>

            </div>
            <div className="history2" style={{ color: getColor(item.status) }}>{statusMap.get(item.status)}</div>
            <div className="history3">{parseInt(item.amount)}U</div>
        </div>)))
    }, [historyData])
    const handleMax = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        setFormValues({
            ...formValue,
            amount: parseInt(detailData.totalAmount) || 50
        })
    }
    const handleChangeAmount = (v: number | [number, number]) => {
        setFormValues({
            ...formValue,
            amount: String(v)
        })
    }
    //弹窗内容
    const renderDialogContent = useMemo(() => {

        return <>
            <Space block className={styles.title} justify="center">
                {i18next.t("title1")}
            </Space>

            <Space block direction="vertical" style={{ gap: "1rem" }}>

                <Space block direction="vertical">
                    <h3 className={styles.title}>  {i18next.t("title1")}</h3>
                    <div style={{
                        background: theme.skin === 'dark' ? "#535B69" : "#F7F8FA",
                        paddingRight: "20px",
                        borderRadius: "1.5rem",
                        height: "2.5rem",
                        border: "1px solid rgba(0,0,0,0.2)",
                        boxSizing: "border-box",

                        paddingLeft: "15px",
                        lineHeight: "2.5rem"
                    }}>
                        <Space
                            block
                            align="center"
                            className="amout_styles"
                            style={{
                                padding: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <Input value={formValue.amount} onChange={handleSetAmount} type="number" min={50} max={detailData.totalAmount} />
                            <Button color="primary" size="small" onClick={handleMax}>MAX</Button>
                        </Space>
                    </div>
                </Space>


                <Space block direction="vertical">
                    <Slider value={Number(formValue.amount)} popover min={50} max={detailData.totalAmount - 1} onChange={handleChangeAmount} className="slider-amout" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>50USDT</span>
                        <span>{parseInt(detailData.totalAmount)}USDT</span>
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
                        paddingLeft: "15px"
                    }}>
                        <Space
                            block
                            align="center"
                            className="amout_styles"
                            style={{
                                padding: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                height: "100%"
                            }}
                        >
                            <Input value={formValue.address} onChange={handleSetAddress} />

                        </Space>
                    </div>

                </Space>

            </Space>
        </>
    }, [detailData, formValue, theme, handleSetAddress, handleMax, handleChangeAmount, handleSetAmount])
    //分享
    const handleShare = (url: string) => {
        copyCot(url)


    }
    const handleLogin = async () => {
        await login();

        await handleGetDetail()
    }
    //切换tabs
    const handleChangeTab = (v: string) => {
        if (v === "history") {

            handleGetHistory()
        }
        if (v === "detail") {
            handleGetDetail()
        }
    }
    const getCode = useMemo(() => {
        return user.inviteCode || local.get("code")
    }, [user])
    const getToal = (v: string) => {
        return parseFloat(v) ? parseFloat(v).toFixed(2) : 0
    }
    return (<div className={`promotion_page ${theme.skin === "dark" ? "promotion_page_dark" : ""}`} style={style}>
        <div className="promotion_header">
            <LeftOutline onClick={goback} style={{ cursor: "pointer" }} />
            <span>{i18next.t("share")}</span>
            <span></span>
        </div>
        <div className="promotion_banner">
            <div className="promotion_banner_left">
                <h1>
                    “
                </h1>
                <p>
                    {i18next.t("share.title1")}
                </p>
                <p>
                    {i18next.t("share.title2")}
                </p>
            </div>
            <div className="promotion_banner_right">
                <div className="promotion_banner_img">

                </div>
            </div>
        </div>
        <div className="promotion_main">
            <div className="promotion_main_box">
                <div className="promotion_main_box_top" >
                    <div className="promotion_main_box_top_header">
                        <li>{i18next.t("leve1")}<span> 15%</span></li>
                        <span></span>
                        <li>{i18next.t("leve2")}<span> 10%</span></li>
                    </div>
                    <div className="promotion_main_box_top_main">
                        {
                            getCode ? <>
                                <div className="promotion_address">
                                    https://mix.poyoo.net/?{getCode}
                                    <Button
                                        size="middle" className="copyEle" color="primary" style={{ background: "#F0FAFC" }} onClick={() => handleShare(`https://mix.poyoo.net/?${getCode}`)}>{i18next.t("share.url")}</Button>
                                </div>

                            </> : <Button color="primary" shape='rounded' style={{ background: "#F0FAFC", color: "#31B7D3" }} onClick={() => handleLogin()}>{i18next.t("share.loginUrl")}</Button>
                        }


                    </div>
                </div>
                <div className="promotion_main_box_bottom">
                    <Tabs style={{ "--title-font-size": "1.3vw" }} onChange={handleChangeTab} defaultActiveKey="detail">
                        <Tabs.Tab title={i18next.t("detail1")} key='detail' >
                            <div className="tab_history">
                                <h2>
                                    <div className="content1">{i18next.t("account")}</div>
                                    <div className="content2">{i18next.t("level")}</div>
                                    <div className="content3">{i18next.t("income")}</div>

                                </h2>
                                {
                                    renderDetail
                                }


                            </div>
                        </Tabs.Tab>
                        <Tabs.Tab title={i18next.t("detail2")} key='history'>
                            <div className="tab_history">

                                {
                                    renderHistory
                                }


                            </div>
                        </Tabs.Tab>

                    </Tabs>
                </div>
            </div>
        </div>
        <div className="promotion_footer">
            <div className="promotion_footer_left">
                <span>{i18next.t("total")}：</span>
                <b>{getToal(detailData.totalAmount)}USDT</b>
                <p style={{ fontSize: "0.5rem" }}>
                    {i18next.t("freeze")} : <b>{getToal(detailData.freezeAmount)}</b>
                </p>
            </div>
            <div className="promotion_footer_right">
                <Button color='primary' shape='rounded' style={{ width: "7.18rem" }} onClick={handleWithdraw}>{i18next.t("button1")}</Button>

            </div>
        </div>
        <Dialog
            className="relay_box promotion_box"
            visible={dialogVisible}
            maskStyle={{ background: "rgba(0,0,0,.85)" }}
            bodyStyle={{ background: theme.skin === "dark" ? "#2F343D" : "#fff" }}
            content={renderDialogContent}

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
    </div>)

}

export default Promotion