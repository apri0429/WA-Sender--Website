import { useParams } from "react-router-dom";

import InputPage from "./InputPage";
import PeriodePage from "./PeriodePage";
import MasterDataPage from "./MasterDataPage";

const PAGES = { input: InputPage, periode: PeriodePage, master: MasterDataPage };

// The Input / Periode / Master Data switch lives in the sidebar.
export default function DataPage() {
  const { tab = "input" } = useParams();
  const Page = PAGES[tab] || InputPage;
  return <Page key={tab} />;
}
