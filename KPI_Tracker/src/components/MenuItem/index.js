import {
  HomeFilled,
  SettingFilled,
  LineChartOutlined
} from '@ant-design/icons';
const url = '';
export const item = [
  {
    key: '1',
    icon: <HomeFilled />,
    label: 'Dashboard',
    url: url + '/dashboard'
  },
  {
    key: '2',
    icon: <LineChartOutlined />,
    label: 'Manage KPI',
    url: url + '/manage-kpi'
  },
  {
    key: '4',
    icon: <SettingFilled />,
    label: 'Setting',
    url: url + '/setting'
  }
]