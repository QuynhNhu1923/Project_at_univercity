import { Tabs } from "antd";
import './Setting.scss'
import EditProfile from "./EditProfile";
import Security from "./Security";

const items = [
  {
    key: '1',
    label: 'Edit Profile',
    children: <EditProfile />,
  },
  {
    key: '2',
    label: 'Security',
    children: <Security />,
  }
]


function Setting() {

  return (
    <>
      <div className="custom-container">
        <Tabs defaultActiveKey="1" items={items} style={{ backgroundColor: '#ffffff', marginTop: '30px', borderRadius: '25px', padding: '30px' }}/>
      </div>

    </>
  )
}

export default Setting;