import { BellOutlined, ExclamationCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Menu } from "antd";

const notifications = [
  {
    key: '1',
    icon: <ExclamationCircleOutlined style={{ color: 'red', marginRight: 8 }} />,
    title: 'Late KPI Alert',
    description: 'You have some KPIs that are overdue.',
    date: '23/05/2024',
    read: false,
  },
  {
    key: '2',
    icon: <CheckCircleOutlined style={{ color: 'green', marginRight: 8 }} />,
    title: 'Complete Tasks',
    description: 'Finish the tasks today to meet KPIs.',
    date: '23/05/2024',
    read: true,
  },
  {
    key: '3',
    icon: <SyncOutlined style={{ color: 'blue', marginRight: 8 }} />,
    title: 'Update KPIs',
    description: 'Remember to update your KPI progress.',
    date: '23/05/2024',
    read: false,
  },
];

const items = notifications.map(notification => ({
  key: notification.key,
  label: (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {notification.icon}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <strong style={{ color: notification.read ? 'gray' : notification.icon.props.style.color }}>
          {notification.title}
        </strong>
        <span>{notification.description}</span>
        <span style={{ fontSize: '12px', color: 'gray' }}>{notification.date}</span>
      </div>
      {!notification.read && <Badge dot style={{ marginLeft: 8 }} />}
    </div>
  ),
}));

items.push({
  key: 'view-all',
  label: (
    <div style={{ textAlign: 'center', marginTop: 8}}>
      <a href="/notifications" style={{ color: 'blue' }}>View All</a>
    </div>
  ),
});

function NotificationButton(props) {
  return (
    <>
      <Dropdown
        overlay={<Menu items={items} />}
        placement="bottomLeft"
        arrow
      >
        <Badge count={notifications.filter(notification => !notification.read).length}>
          <Avatar size={32} style={{ backgroundColor: "#F5F7FA" }}>
            <BellOutlined style={{ color: "red",cursor: 'pointer' }} />
          </Avatar>
        </Badge>
      </Dropdown>
    </>
  );
}

export default NotificationButton;
