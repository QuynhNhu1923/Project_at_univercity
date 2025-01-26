import React from 'react';
import {
  UserOutlined,
  DownOutlined,
  PoweroffOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Space, theme, Grid } from 'antd';
import { Link } from 'react-router-dom';
import NotificationButton from '../../components/NotificationButton';
import './Header.scss';
import Language from '../../components/Language';
import Help from '../../components/Help';
import { useDispatch } from 'react-redux';
import { changeSider } from '../../actions/Sider';

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

function Header(props) {
  const dispatch = useDispatch();
  const screen = useBreakpoint();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleClick = () => {
    if (screen.sm) {
      props.toggleCollapsed();
    } else {
      props.showDrawer();
    }
  };

  const handlePersonalInfoClick = () => {
    dispatch(changeSider("4"));
  };

  const items = [
    {
      label: (
        <Link to="/setting" onClick={handlePersonalInfoClick}>
          <Space>
            <UserOutlined />
            <div>Personal Information</div>
          </Space>
        </Link>
      ),
      key: '0',
    },
    {
      type: 'divider',
    },
    {
      label: (
        <a href="/">
          <Space>
            <PoweroffOutlined />
            <div>Log out</div>
          </Space>
        </a>
      ),
      key: '3',
    },
  ];

  return (
    <AntHeader
      style={{
        paddingRight: '0px',
        paddingLeft: '0px',
        background: colorBgContainer,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Button
        type="text"
        icon={props.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={handleClick}
        style={{
          fontSize: '16px',
          width: 64,
          height: 64,
        }}
      />
      <div className="actions">
        <Space size="large">
          <div className="actions__help">
            <Help />
          </div>
          <div className="actions__notification">
            <NotificationButton />
          </div>
          <Language />
          <Dropdown menu={{ items }} trigger={['click']}>
            <button
              onClick={(e) => e.preventDefault()}
              className="dropdown-button"
            >
              <Space>
                <Avatar size={40} />
                {screen.sm && <div className="info">
                  <div className="info__name">Vũ Thị Hương Giang</div>
                  <div className="info__role">Lecturer</div>
                </div>}
                <DownOutlined />
              </Space>
            </button>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
}

export default Header;
