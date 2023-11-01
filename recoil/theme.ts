import { atom } from "recoil";

type ThemeType = "light" | "dark";
type LanguageType = "tw"|"zh"|"en"

export interface ThemePropsType {
  skin:ThemeType,
  language:LanguageType
}
interface BackgroundType {
  deposit:string, //点存款时背景图
  withdraw:string//点取款时背景图
}
interface LangType {
  zh:BackgroundType,
  en:BackgroundType,
  tw:BackgroundType
}
export interface ThemeImgType {
  dark:LangType
  light:LangType
}
export const themeState = atom<ThemePropsType>({
  key: "themeState",
  default:{
    skin:"light",
    language:"en"
  },
});
