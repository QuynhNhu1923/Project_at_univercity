import { get } from '../../utils/request'

export const getKpiTargets = async (kpiTypeId) => {
  const result = await get("KpiTargets" + "?KpiId=" + kpiTypeId);
  return result;
}