import { Layout } from "antd";
import { Outlet } from "react-router-dom";

const { Content } = Layout;

function MainContent() {
  return (
    <>
      <Content style={{
        // margin: '24px 16px 0 16px',
        minHeight: 400,
        background: '#F5F6FA',
      }}>
        <Outlet/>
      </Content>
    </>
  )
}

export default MainContent;