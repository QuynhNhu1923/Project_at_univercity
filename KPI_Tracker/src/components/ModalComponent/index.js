// ModalComponent.js
import React from 'react';
import { Modal, Button } from 'antd';
import ModalContent from '../ModalContent';
import { useSelector } from 'react-redux';

const ModalComponent = ({ isOpenModal, handleOk, handleCancel ,form}) => {
  const sampleKpi = useSelector(state => state.modal);
  
  return (
    <Modal
      title={ sampleKpi ? "Update KPI Template" : "Add KPI Template"}
      visible={isOpenModal}
      onCancel={handleCancel}
      // width={600}
      style={{ top: 0 }}
      footer={[
        <Button key="submit" type="primary" onClick={handleOk} style={{backgroundColor: '#1814f2',color: '#ffff'}}>
          { sampleKpi ? "Update" : "Create" }
        </Button>,
      ]}
    >
      <ModalContent form={form}/>
    </Modal>
  );
};

export default ModalComponent;
