import { useState } from "react";
import { Button, Col, DatePicker, Form, Image, Input, Row, Upload, Grid } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import dayjs from "dayjs";

const { useBreakpoint } = Grid;
// Hàm chuyển đổi file sang URL base64
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function EditProfile() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState([]);
  const screen = useBreakpoint();

  // Xử lý preview ảnh
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  // Xử lý thay đổi fileList
  const handleChange = async ({ fileList: newFileList }) => {
    // Chỉ giữ lại file cuối cùng được tải lên
    const file = newFileList.slice(-1)[0];
    if (file) {
      const preview = await getBase64(file.originFileObj);
      setPreviewImage(preview);
    }
    setFileList(newFileList.slice(-1));
  };

  // Nút upload
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <>
      <Row gutter={[20, 20]}>
        <Col sm={5} xs={24} className={screen.xs ? "upload-center" : ""}>
          <Upload
            action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
            listType="picture-circle"
            fileList={fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            beforeUpload={() => false}
            className={"customSizedUpload"}
          >
            {fileList.length >= 1 ? null : uploadButton}
          </Upload>
          {previewImage && (
            <Image
              style={{
                display: 'none'
              }}
              preview={{
                visible: previewOpen,
                onVisibleChange: (visible) => setPreviewOpen(visible),
                afterClose: () => setPreviewImage(''),
              }}
              src={previewImage}
            />
          )}
        </Col>
        <Col sm={19} xs={24}>
          <Form layout="vertical" style={{color: "#010c80"}}>
            <Row gutter={20}>
              <Col sm={12} xs={24}>
                <Form.Item name="name" label="Your Name">
                  <Input />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item name="userName" label="User Name">
                  <Input value="Vũ Thị Hương Giang"/>
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item name="email" label="Email">
                  <Input />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item name="password" label="Password">
                  <Input.Password placeholder="********" />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item name="dob" label="Date Of Birth">
                  <DatePicker defaultValue={dayjs('01/01/1999', 'DD/MM/YYYY')} style={{ width: '100%' }}/>
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item name="address" label="Address">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Row style={{display: 'flex',justifyContent:'flex-end',alignItems:'flex-end'}}>
                  <Button type="primary">Update info</Button>
                </Row>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default EditProfile;
