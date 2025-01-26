import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Upload, Button, Row, Col, Table, Popconfirm } from 'antd';
import { UploadOutlined,DeleteOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';
import { addTarget, removeTarget } from '../../actions/Targets';


const ModalContent = ({ form }) => {
  
  const dispatch = useDispatch(); // Đảm bảo bạn đã khai báo biến dispatch từ useDispatch
  const sampleKpi = useSelector(state => state.modal);
  const targets = useSelector(state => state.target);

  const handleAddTarget = () => {
    form.validateFields(['nameTarget', 'unit']).then(values => {
      const newTarget = { name: values.nameTarget, unit: values.unit };
      dispatch(addTarget(newTarget));
      form.resetFields(['nameTarget', 'unit']);
    });
  };

  const columns = [
    {
      title: 'Name target',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this target?"
          onConfirm={() => dispatch(removeTarget(record.name))}
        >
          <Button type="link" icon={<DeleteOutlined style={{ color: 'red' }} />} />
        </Popconfirm>
      ),
    }
  ];

  
  useEffect(() => {
    if (sampleKpi) {
      form.setFieldsValue(sampleKpi);
    }
  }, [sampleKpi, form]);

  return (
    <Form layout='vertical' form={form} initialValues={sampleKpi}>
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      <Row gutter={[20, 10]}>
        <Col xs={24}>
          <Form.Item name="name" label="KPI Name:" style={{ marginBottom: 0 }}>
            <Input placeholder="Enter KPI name" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="description" label="Description:" style={{ marginBottom: 0 }}>
            <TextArea placeholder="Enter description" />
          </Form.Item>
        </Col>
      </Row>

      <span className='form-row-title'>Add target</span>
      <Row gutter={[20, 10]}>
        <Col xs={24} sm={12}>
          <Form.Item name="nameTarget" label="Name target:" style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Please enter target name' }]}>
            <Input placeholder="Enter target name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="unit" label="Unit:" style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Please enter unit' }]}>
            <Input placeholder="Enter unit" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Upload>
            <Button icon={<UploadOutlined />}>Import file</Button>
          </Upload>
        </Col>
      </Row>
      <Row justify="end" gutter={[20, 20]}>
        <Col>
          <Button onClick={handleAddTarget} style={{ marginBottom: '20px', backgroundColor: '#1814f2', color: '#ffff' }}>Add Target</Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={targets} rowKey="name" />
    </Form>
  );
};

export default ModalContent;
