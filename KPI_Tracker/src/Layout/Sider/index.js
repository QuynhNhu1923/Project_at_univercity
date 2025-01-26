import { Layout, Menu, Grid, Drawer, Tour } from "antd";
import { Link } from "react-router-dom";
import { item } from "../../components/MenuItem";
import Logo from "../../components/Logo/Logo";
import './Sider.scss';
import { useDispatch, useSelector } from "react-redux";
import { helpSiderClose } from "../../actions/Help";
import { useRef, useEffect, useState } from "react";
import { changeSider } from "../../actions/Sider";

const { Sider: AntSider } = Layout;
const { useBreakpoint } = Grid;

function Sider(props) {
    const [selectedKeys, setSelectedKeys] = useState("1");
    const checked = useSelector(state => state.sider);
    const dispatch = useDispatch();
    const screen = useBreakpoint();
    const open = useSelector(state => state.helpSider);
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);

    useEffect(() => {
        setSelectedKeys([checked]);
    }, [checked]);

    const handleMenuItemClick = (key) => {
        setSelectedKeys([key]);
        dispatch(changeSider(key));
    };

    const steps = [
        {
            title: 'Dashboard',
            description: 'Bạn có thể xem thông tin về KPI tổng quát ở đây!',
            target: () => ref1.current
        },
        {
            title: 'Manage KPI',
            description: 'Ở đây bạn có thể tạo mẫu KPI, tạo KPI, cũng như xem lịch sử hoàn thành',
            target: () => ref2.current
        },
        {
            title: 'Setting',
            description: 'ở đây là trang cá nhân hóa, bạn có thể tùy chỉnh theo sở thích của mình.',
            target: () => ref3.current
        }
    ];

    return (
        <>
            {screen.sm ? (
                <AntSider width={250} trigger={null} collapsed={props.collapsed}>
                    <Logo collapsed={props.collapsed} />
                    <Menu mode="inline" theme="dark" selectedKeys={selectedKeys} defaultSelectedKeys={["1"]}>
                        {item.map((menuItem) => (
                            <Menu.Item key={menuItem.key} icon={menuItem.icon} onClick={() => handleMenuItemClick(menuItem.key)}>
                                <Link to={menuItem.url} ref={menuItem.label === 'Dashboard' ? ref1 : menuItem.label === 'Manage KPI' ? ref2 : ref3}>
                                    {menuItem.label}
                                </Link>
                            </Menu.Item>
                        ))}
                    </Menu>
                </AntSider>
            ) : (
                <Drawer title={<Logo />} open={props.open} placement="left" width={200} closable={false} onClose={props.onClose}>
                    <Menu mode="inline" selectedKeys={selectedKeys}>
                        {item.map((menuItem) => (
                            <Menu.Item key={menuItem.key} icon={menuItem.icon} onClick={() => handleMenuItemClick(menuItem.key)}>
                                <Link to={menuItem.url} onClick={props.onClose}>
                                    {menuItem.label}
                                </Link>
                            </Menu.Item>
                        ))}
                    </Menu>
                </Drawer>
            )}
            <Tour open={open} steps={steps} onClose={() => dispatch(helpSiderClose())} />
        </>
    );
}

export default Sider;
