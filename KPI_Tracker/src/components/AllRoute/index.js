import { useRoutes } from "react-router-dom";
import { routes } from "../../routes"

function AllRoute(){
  return useRoutes(routes);
}

export default AllRoute;