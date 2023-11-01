/*
 * @description  : 
 * @Version      : V1.0.0
 * @Author       : zhangHuan
 * @Date         : 2023-07-20 09:08:45
 * @LastEditTime : 2023-07-20 09:10:58
 * @FilePath     : index.tsx
 */
import i18next from 'i18next';
import en from "./en.json"
import zh from "./zh.json"
import tw from "./tw.json"
i18next.init({
    lng: 'en', // if you're using a language detector, do not define the lng option
    debug: true,
    resources: {
        en: {
            translation: en
        },
        zh: {
            translation: zh
        },
        tw: {
            translation: tw
        }
    }
});

