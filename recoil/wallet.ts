import { atom } from "recoil";

export interface IWallet {
  type: string;
  account: string;
  build16:any
}

export const walletState = atom<IWallet>({
  key: "walletState",
  default: {
    type: "",
    account: "",
    build16:null,
  },
});
