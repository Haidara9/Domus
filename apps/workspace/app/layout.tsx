import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'DOMUS | مساحة العمل',description:'مساحة دوموس لإدارة العقارات والمحتوى والإنتاج والنشر.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
