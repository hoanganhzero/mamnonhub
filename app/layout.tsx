import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Mầm Non Yêu Thương",description:"Nền tảng kết nối nhà trường, cô giáo và phụ huynh trong hành trình chăm sóc trẻ mầm non.",icons:{icon:"/mam-non-yeu-thuong-logo.png",shortcut:"/mam-non-yeu-thuong-logo.png"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="vi"><body>{children}</body></html>}
