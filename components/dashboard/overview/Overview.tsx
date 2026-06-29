import AIOverview from "./AIOverview";
import Search from "./Search";
import Download from "./Download";
import Forcast from "./Forcast";
import Lightning from "./Lightning";
import HourlyWeather from "./HourlyWeather";
import SoilMoisture from "./SoilMoisture";
import Weather from "./Weather";

const Overview = () => {
  return (
    <>
      <Search />
      <AIOverview />
      <Weather />
      <Download />
      <Forcast />
      <Lightning />
      <HourlyWeather />
      <SoilMoisture />
    </>
  );
};

export default Overview;
