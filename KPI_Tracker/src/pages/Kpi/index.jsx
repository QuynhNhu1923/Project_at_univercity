import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Breadcrumb, Flex, Progress, Modal, Form, Input, Button, notification, DatePicker, Col, Row, Select, Popconfirm } from "antd";
import all_icons from '../../assets/icon/all_icon';
import TextArea from 'antd/es/input/TextArea';

function Kpi() {
    const location = useLocation();
    const { state } = location;
    const { name, kpis } = state;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState("add"); // add or update
    const [currentKpi, setCurrentKpi] = useState(null);
    const [form] = Form.useForm();
    const [targetNames, setTargetNames] = useState([]);

    const breadcrumbStyle = {
        marginBottom: "5px",
        marginTop: "10px",
        cursor: "pointer",
    };

    const showKpiModal = (type, kpi = null) => {
        setModalType(type);
        setCurrentKpi(kpi);
        console.log(kpi);
        if (kpi) {
            // Set initial values for form fields
            form.setFieldsValue({
                name: kpi.name,
                priority: kpi.priority, // Assuming priority is a field in your form
                start: kpi.start, // Assuming start is a field in your form
                end: kpi.end, // Assuming end is a field in your form
                description: kpi.description, // Assuming description is a field in your form
                target: kpi.target
                // Add more fields as needed
            });
        } else {
            // Set initial target names if adding a new KPI
            form.resetFields(['name', 'description']);
            form.setFieldsValue({
                target: state.target
            })
        }
        setIsModalVisible(true);
    };

    const handleModalSubmit = (values) => {
        if (modalType === "add") {
            // Logic for adding a new KPI
        } else if (modalType === "update") {
            // Logic for updating an existing KPI
        }
        setIsModalVisible(false);
        notification.success({ message: `${modalType === "add" ? "KPI added" : "KPI updated"} successfully!` });
    };

    const options = [
        { label: "NaN", value: null },
        { label: <img src={all_icons.qldt} style={{ height: '15px', width: '15px', objectFit: 'contain' }} />, value: 'qldt' },
        { label: <img src={all_icons.quizlet} style={{ height: '15px', width: '15px', objectFit: 'contain' }} />, value: 'quizlet' },
        { label: <img src={all_icons.schooler} style={{ height: '15px', width: '15px', objectFit: 'contain' }} />, value: 'schooler' }
    ];


    const resetFormFields = () => {
        form.resetFields(['name', 'description']);
        const resetTarget = state.target.map(target => ({
            ...target,
            goal: null,
            weight: null
        }));

        form.setFieldsValue({
            target: resetTarget
        });
    };

    const handleDeleteKpi = (id) => {
        notification.success({ message: "KPI deleted successfully!" });
    }


    return (
        <>
            <div className="custom-container">
                <h1 className="page-title">{name}</h1>
                <div className="row-duy">
                    <Breadcrumb separator=">" style={breadcrumbStyle}>
                        <Breadcrumb.Item><Link to="/manage-kpi">Manage KPI</Link></Breadcrumb.Item>
                        <Breadcrumb.Item>{name}</Breadcrumb.Item>
                    </Breadcrumb>
                    <Button type="primary" onClick={() => showKpiModal("add")}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <PlusCircleOutlined style={{ marginRight: "5px" }} />
                            <div>Add KPI</div>
                        </div>
                    </Button>
                </div>
                {kpis && kpis.map((item, index) => (
                    <div className="item-kpi" key={index}>
                        <div className="item-kpi-info">
                            <Link to={`/manage-kpi/${state.id}/${item.id}`} state={{ ...item, typeId: state.id }}>
                                <h2 className="item-kpi-name">{item.name}</h2>
                            </Link>
                            <p className="item-kpi-desc">{item.description}</p>
                        </div>
                        <div className="item-kpi-act">
                            <Flex vertical gap="small" style={{ width: 180 }}>
                                <Progress percent={item.percentage} strokeWidth={8} strokeColor="#52c41a" status="active" />
                            </Flex>
                            <div className="item-kpi-btn-act">
                                <button className="item-kpi-btn" onClick={() => showKpiModal("update", item)}><EditOutlined /></button>
                                <button className="item-kpi-btn btn-remove">
                                    <Popconfirm
                                        title="Are you sure you want to delete this KPI?"
                                        onConfirm={() => handleDeleteKpi(item.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <DeleteOutlined />
                                    </Popconfirm>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Modal
                title={modalType === "add" ? "Add KPI" : "Update KPI"}
                visible={isModalVisible}
                onCancel={() => { resetFormFields(); setIsModalVisible(false) }}
                footer={null}
            >
                <Form layout='vertical' onFinish={handleModalSubmit} form={form}>
                    <Row gutter={[20, 20]}> {/* Thêm khoảng cách giữa các hàng */}
                        <Col sm={12} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.Item label="Name" name="name" form={form}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col sm={12} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.Item label="Priority" name="priority">
                                <Select options={[
                                    {
                                        label: "Medium",
                                        value: "medium"
                                    },
                                    {
                                        label: "High",
                                        value: 'high'
                                    },
                                    {
                                        label: "Low",
                                        value: "low"
                                    }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col sm={12} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.Item label="Start" name="start">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col sm={12} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.Item label="End" name="end">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col sm={24} xs={24}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.Item label="Description" name="description">
                                <TextArea />
                            </Form.Item>
                        </Col>
                        <Col sm={24} xs={24}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                            <Form.List name="target">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map((field, index) => (
                                            <Row key={field.key} gutter={[20, 20]}> {/* Thêm khoảng cách giữa các cột */}
                                                <Col sm={10} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                                                    <Form.Item
                                                        {...field}
                                                        label="Name target"
                                                        name={[field.name, 'name']}
                                                        fieldKey={[field.fieldKey, 'name']}
                                                        initialValue={state.target[index].name}
                                                    >
                                                        <Input style={{ color: 'black' }} />
                                                    </Form.Item>
                                                </Col>
                                                <Col sm={5} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                                                    <Form.Item
                                                        {...field}
                                                        label="Goal"
                                                        name={[field.name, 'goal']}
                                                        fieldKey={[field.fieldKey, 'goal']}
                                                        initialValue={state.target[index].goal}
                                                    >
                                                        <Input type="number" />
                                                    </Form.Item>
                                                </Col>
                                                <Col sm={5} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                                                    <Form.Item
                                                        {...field}
                                                        label="Weight"
                                                        name={[field.name, 'weight']}
                                                        fieldKey={[field.fieldKey, 'weight']}
                                                        initialValue={state.target[index].weight}
                                                    >
                                                        <Input type="number" />
                                                    </Form.Item>
                                                </Col>
                                                <Col sm={4} xs={12}> {/* Chỉnh lại độ rộng cho màn hình nhỏ */}
                                                    <Form.Item
                                                        {...field}
                                                        label="Follow"
                                                        name={[field.name, 'follow']}
                                                        fieldKey={[field.fieldKey, 'follow']}
                                                        initialValue={state.target[index].follow}
                                                    >
                                                        <Select options={options} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        ))}
                                    </>
                                )}
                            </Form.List>
                        </Col>
                        <Col xs={24} sm={24}>
                            <Row justify='end'>
                                <Button type="primary" htmlType="submit" style={{ marginBottom: '20px', backgroundColor: '#1814f2', color: '#ffff' }}>
                                    Save
                                </Button>

                            </Row>
                        </Col>
                    </Row>
                </Form>
            </Modal>

        </>
    );
}

export default Kpi;

