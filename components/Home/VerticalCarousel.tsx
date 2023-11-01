"use client";

import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { generateRandomNumber, generateRandomHex } from "@/utils";
import { Card, Dialog, Button } from "antd-mobile";
import styles from "./scroll.module.css";
import { RightOutline } from "antd-mobile-icons";
import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { themeState } from "@/recoil/theme";
import ethWebpImg from "@/public/eth@2x.webp"
import ethPngImg from "@/public/eth@2x.png"
import trxWebpImg from "@/public/trx@2x.webp"
import trxPngImg from "@/public/trx@2x.png"
import usdtWebpImg from "@/public/USDT@2x.webp"
import usdtPngImg from "@/public/USDT@2x.png"
import i18next from 'i18next';
var settings = {
  dots: false,
  infinite: true,
  slidesToShow: 3,
  slidesToScroll: 1,
  vertical: true,
  verticalSwiping: true,
  autoplay: true,
  arrows: false,
};

const VerticalCarousel: React.FC = () => {
  const [theme, setTheme] = useRecoilState(themeState);
  const createItem = () => {
    return {
      timestamp: new Date().toISOString(),
      address: generateRandomHex(),
      amount: generateRandomNumber(0.1, 100, 2),
      time: generateRandomNumber(1, 60, 0),
    };
  };

  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    setItems(new Array(10).fill(0).map(() => createItem()));
  }, [])
  const clear = () => {
    setItems([]);
    setTimeout(() => {
      setItems(new Array(10).fill(0).map(() => createItem()));
    }, 800);
  };
  //显示详情
  const handeleDetail = () => {
    theme
    Dialog.alert({
      className: `detail-dialog ${theme.skin==='dark'?"detail-dialog-dark":""}`,
      header: (
        <div className={styles['detail-header']}>
          <div className={styles.logoImg}>
          </div>
          <span>
            {i18next.t("about")}
          </span>
        </div>
      ),
      content: (
        <div className={styles['detail-content']}>
          <div >
          {i18next.t("about.title")}
          </div>
          <div >
            <div>
            {i18next.t("about.content.title")}
            </div>
            <div>
              <ol>
              <li>1. {i18next.t("about.content1")}</li>
              <li>2. {i18next.t("about.content2")}</li>
              <li>3. {i18next.t("about.content3")}</li>
              <li>4. {i18next.t("about.content4")}</li>
              </ol>
              <ul>
              {i18next.t("about.end")}
              </ul>
            </div>
          </div>
        </div>
      ),
      confirmText:i18next.t("enter")
    })
  }
  return (
    <Card
      headerStyle={{
        fontSize: "1.2rem",
        width: "100%",
        borderBottom: theme.skin === "dark" ? "solid 1px rgba(255,255,255,.4)" : "solid 1px #E1E5EB",

      }}
      bodyStyle={
        {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          // background:"#292F38"
        }
      }

      title={
        <div className={styles['card-title-main']}>
          <div className={styles['card-title']}>
          <div className={styles.logoImg}>
          </div>
          <span>
            {i18next.t("about")}
          </span>
        </div>
         <span onClick={handeleDetail}>
            {i18next.t("more")}  <RightOutline />
       </span>
        </div>
      }
      // style={{ borderRadius: "20px", height: "11.6rem" }}
      style={{ background: theme.skin === "dark" ? "#3E4652" : "#fff", borderRadius: "20px", minHeight: "20rem", height: "auto", display: "flex", flexDirection: "column", boxShadow: "0px 0px 10px 1px rgba(0,0,0,0.12)" }}

    >
      {/* <div className={styles["scrollable-wrapper"]}> */}
      {/* <Slider {...settings} className={`${styles.sliderBox} sliderBox`}>
          {items.map((item, i) => (
            <div key={i} suppressHydrationWarning style={{ height: "100%" }}>
              <Space
                {...{ block: true, justify: "around" }}
                style={{ "--gap": "24px", height: "2.5rem", width: "100%" }}
              >
                <div suppressHydrationWarning className={styles.item}>{item.address}</div>
                <div suppressHydrationWarning className={styles.item}>{item.time}分钟前</div>
                <div suppressHydrationWarning className={styles.item}>{item.amount}ETH</div>
              </Space>
            </div>
          ))}
        </Slider> */}
      <div className={styles['scrollable-wrapper-content']} style={{ color: theme.skin === "dark" ? "rgba(255,255,255,.8)" : "" }}>
     

        <div className={styles['content-title']}>
          {i18next.t("about.title")}
        </div>
       
      </div>
      <ul className={styles['scrollable-wrapper-ul']}>
        <li style={{ color: theme.skin === "dark" ? "rgba(255,255,255,.8)" : "" }}>
          {i18next.t("supports")}
        </li>
        <ol className={`${styles['scrollable-wrapper-ol']} scrollable-wrapper-image`}>
          <li className={styles['scrollable-wrapper-li']}>
            <div className="images">
              <picture>
                <source srcSet={ethWebpImg.src} type="image/webp" />
                <img src={ethPngImg.src} alt="" />
              </picture>
            </div>
            <span style={{ color: theme.skin === "dark" ? "rgba(255,255,255,.8)" : "" }}>
              ETH
            </span>
          </li>
          <li className={styles['scrollable-wrapper-li']}>
            <div className="images">
              <picture>
                <source srcSet={trxWebpImg.src} type="MIME-TYPE" />
                <img src={trxPngImg.src} decoding="async" loading="lazy" alt=""/>
              </picture>
            </div>
            <span style={{ color: theme.skin === "dark" ? "rgba(255,255,255,.8)" : "" }}>
              TRX
            </span>
          </li>
          <li className={styles['scrollable-wrapper-li']}>
            <div className="images">
              <picture>
                <source srcSet={usdtWebpImg.src} type="image/webp" />
                <img src={usdtPngImg.src} alt="" />
              </picture>
            </div>
            <span style={{ color: theme.skin === "dark" ? "rgba(255,255,255,.8)" : "" }}>
              USDT
            </span>
          </li>
        </ol>
      </ul>
      {/* </div> */}
    </Card>
  );
};

export default VerticalCarousel;
