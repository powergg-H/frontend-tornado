import { atom } from "recoil";

export interface IWithdraw {
  noteString: string;
  recipient: string;
  relay:{
    address:string,
    cost:string
  }
}

export const withdraw = atom<IWithdraw>({
  key: "withdraw",
  default: {
    noteString: "",
    recipient: "",
    relay:{
      address:"",
      cost:""
    }
  },
});
