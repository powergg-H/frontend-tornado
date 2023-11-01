
import RecoilRootWrapper from "@/wrappers/RecoilRootWrapper";
import styles from "@/app/index.module.css";
import "antd-mobile/es/global"
export const metadata = {
  title: "TokenVortex",
  description: "web3 TokenVortex",
  viewport:"width=device-width, initial-scale=0.95,user-scalable=0"
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" >
      <body suppressHydrationWarning={true} >
      
        <div className={`${styles.container}`}>
            
          <RecoilRootWrapper>{children}</RecoilRootWrapper>
        </div>
      </body>
    </html>
  );
}
