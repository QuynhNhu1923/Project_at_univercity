import { get, post } from '../utils/request'

export const getKpiTypes = async () => {
  let result = await get("kpiTypes");
  return result;
}

export const getKpiType = async (id) => {
  let result = await get("kpiTypes?id="+id);
  return result;
}

export const addKpiType = async(data) => {
  let result = await post("kpiTypes",data);
  return result; 
}
