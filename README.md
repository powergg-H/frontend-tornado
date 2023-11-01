## Getting Started

#### First

`npm install`


#### run the development server:
```bash
npm run dev

```

#### run the production:
```bash
npm run build
```


#### directory
```
├─next.config.js        [next中webpack配置文件]
├─tsconfig.json         [ts相关配置]    
├─wallConnect           
|      ├─config.ts      [walletConnect配置文件]
|      └index.ts        [封装的具体代码]
├─utils
|   ├─config_index.ts   [全局使用的动态属性和方法]
|   ├─deposit.bak.js
|   ├─index.ts          [全局公共方法]   
|   ├─watch.ts          [浏览器插件端监听方法]
|   ├─web3.ts           [连接钱包的处理逻辑]
|   ├─withdraw          
|   |    ├─index.js     [以太坊的取款逻辑]
|   |    └tronLink.js   [tronLink的取款逻辑]
|   ├─deposit
|   |    ├─eip2612.js
|   |    ├─index.js     [取款通用逻辑]
|   |    ├─metaMask_config.ts  [以太坊配置文件]
|   |    ├─nogas.js     [nogas服务逻辑]
|   |    ├─nogas_trx.js [tronlink服务逻辑(待用)]
|   |    └tronLink_config.ts   [tronLink配置文件]
├─service
|    ├─config.ts        [接口服务相关配置]
|    └index.ts          [axios全局封装处理]
├─recoil                [全局store]
|   ├─atoms.ts
|   ├─deposit.ts
|   ├─selectors.ts
|   ├─theme.ts
|   ├─user.ts
|   ├─wallet.ts
|   ├─walltConnect.ts
|   └withdraw.ts
├─public               [静态文件]
├─pages
├─lang                 [语言翻译文件]
|  ├─en.json            
|  ├─index.tsx  
|  ├─tw.json
|  └zh.json
├─contracts_trx        [tronlink合约]
├─contracts            [以太坊合约]
├─components           [公共组件]
|     ├─Promotion.tsx   
|     ├─Home
|     |  ├─AmountSelector.tsx
|     |  ├─AmountSlider.tsx
|     |  ├─CurrencySelector.tsx
|     |  ├─Deposit.tsx
|     |  ├─DepositResultContent.tsx
|     |  ├─DepositTipContent.tsx
|     |  ├─ExchangeGas.tsx
|     |  ├─ExchangeGasContent.tsx
|     |  ├─home.module.css
|     |  ├─scroll.module.css
|     |  ├─ThemeSwitch.tsx
|     |  ├─VerticalCarousel.tsx
|     |  ├─Wallet.tsx
|     |  ├─WithDrawTabContent.tsx
|     |  └WithdrawTipContent.tsx
├─circuits              [解析凭证等使用的文件]
├─app                   [项目入口]
|  ├─dark.module.css
|  ├─favicon.ico
|  ├─globals.css
|  ├─home.module.css
|  ├─index.module.css
|  ├─layout.tsx
|  ├─page.js.nft.json
|  ├─page.tsx
|  ├─promotion.css
|  ├─reset.css
|  ├─dashboard
|  |     ├─page.js.nft.json
|  |     └page.tsx
├─Api                  [具体的业务接口]
|  ├─index.ts
|  └types.d.ts

```
### 下面是一些可能需要更改的配置（根据实际情况）

####  WalletConnect 
1. 官方文档地址 https://walletconnect.com/
2. 使用walletConnect服务必须要有PROJECT_ID,此项目的PROJECT_ID是作者自己的,建议更换，以保持项目稳定。只需要简单注册然后创建一个项目就可以。 注册地址:https://cloud.walletconnect.com/sign-in    PROJECT_ID更改位置  /walletConnect/config


####  /utils/deposit/metaMask_config
1. 此为以太坊配置文件 支持以相同格式添加不同网络支持
```
    deployments:{
        netId1:{  //netWork id值 例如 以太坊主网 id为1  netId1  Goerli测试网为5 netId5
            eth: {  //支持的币种
                instanceAddress: { //对应价格的合约地址
                        0.1: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
                        1: '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936',
                        10: '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF',
                        100: '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291',
                        },
                    tokenAddress?: //代币地址 主币不需要此属性  使用这个地址可以导入对应的代币
                    symbol: 'ETH',
                    decimals: 18,
      },
        }
    }
```

####  /utils/deposit/tronLink_config 
1. tronlink配置文件



####  /service/config   开发环境和生产环境接口地址配置文件
1. 分享相关接口地址
2. relay服务相关接口地址