import { Card, Image, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EditOutlined } from '@ant-design/icons';

const { Meta } = Card;

function ItemKpiType(props) {
  const navigate = useNavigate();
  const { item }  = props;
  const handleImageClick = () => {
    navigate('/manage-kpi/' + item.id);
  };

  return (
    <Card
      hoverable
      style={{ width: '100%', boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)', marginBottom: '30px' ,cursor: 'pointer'}}
      cover={
        <Image
          src={item.thumbnail}
          preview={{
            mask: (
              <div>
                <EditOutlined /> Xem chi tiết
              </div>
            )
          }}
          height={240}
          style={{objectFit: 'cover',marginBottom: '#dddddd'}}
        />
      }
      onClick={handleImageClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Meta title={item.name} description="50 KPI" />
        <Progress type="circle" percent={75} width={50} />
      </div>
    </Card>
  );
}

export default ItemKpiType;
