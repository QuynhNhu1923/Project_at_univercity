import { Layout } from 'antd';
import Header from '../Header';
import Sider from "../Sider";
import MainContent from "../MainContent";
import { useState } from 'react';


function LayoutDefault() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const [open, setOpen] = useState(false);
  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsed={collapsed} toggleCollapsed={toggleCollapsed} open={open} onClose={onClose}/>
      <Layout>
        <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} showDrawer={showDrawer}/>
        <MainContent />
      </Layout>
    </Layout>
  );
}

export default LayoutDefault;
