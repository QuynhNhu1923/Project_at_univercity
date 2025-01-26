import { del, get, patch, patch1, post } from '../utils/request'

export const getKpis = async () => {
  let result = await get("kpi");
  return result;
}

export const getKpi = async (id) => {
  let result = await get("kpi/"+id);
  return result;
}

export const postKpis = async (data) => {
  await post("kpi",data);
}

export const deleteKpiById = async (id) => {
  let result = await del("kpi",id);
  return result;
}

export const updateKpi = async (data) => {
  let result = await patch1("kpi/"+ data.id,data);
  return result;
}