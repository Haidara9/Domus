import ShowcaseViewer from '../../components/ShowcaseViewer';
export const metadata={title:'DOMUS | عرض عقاري خاص',description:'اختيارات عقارية خاصة من دوموس للمقارنة والمعاينة.'};
export default async function Page({params}:{params:Promise<{id:string}>}){return <ShowcaseViewer id={(await params).id}/>;}
