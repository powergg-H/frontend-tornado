"use client";

import styles from "@/app/index.module.css";
import { Space } from "antd-mobile";
import classNames from "classnames/bind";
import React, { useState,useCallback, Dispatch,SetStateAction,MutableRefObject,forwardRef,useImperativeHandle} from "react";
import { useRecoilState } from "recoil";
import { depositState as deposit } from "@/recoil/deposit";
import { themeState } from "@/recoil/theme";
let cx = classNames.bind(styles);


export default forwardRef(function AmoutSelector(props,ref) {
  const [theme, setTheme] = useRecoilState(themeState);
  const [depositState, setDepositState] = useRecoilState(deposit);
  const { amountList, currency,amount } = depositState;
  const [current, setCurrent] = useState(0);
  const handleSelect = (i: number) => {
   
    setCurrent(i);

    setDepositState({ ...depositState, amount: amountList[i],setAmoutSelect:setCurrent });
  };
  useImperativeHandle(ref,()=>({
    setCurrent
  }))
  return (
    <div className={styles["amount-selector"]}>
      <span className={theme.skin==="dark"?styles['line-dark']:styles.line} />
      <Space {...{ block: true, justify: "between" }}>

        {depositState.amountList.map((item, i) => (
          <Space
            key={i}
            className={cx({
              "selector-item": true,
              current: i === current,
            })}
            direction="vertical"
            align="center"
            style={{ "--gap-vertical": "1rem" }}
            onClick={() => handleSelect(i)}
          >
            <span className={styles.dot} />
            <span className={styles.amount}>
              {item} 
            </span>
          </Space>
        ))}
      </Space>
    </div>
  );
})
