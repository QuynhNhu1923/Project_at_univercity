import { Dropdown, Menu, Grid } from "antd";
import all_imgs from "../../assets/img/all_img";
import './Language.scss'

const { useBreakpoint } = Grid;

function Language() {
  const screen = useBreakpoint();

  const items = (
    <Menu>
      <Menu.Item key="0">English</Menu.Item>
      <Menu.Item key="1">Vietnamese</Menu.Item>
    </Menu>
  );

  const dropdownContent = (
    <div className="container__language">
      {screen.sm && (
        <div className="actions__language">
          <img src={all_imgs.england} alt="england" />
        </div>
      )}
      <button onClick={(e) => e.preventDefault()}>
        {!screen.sm ? (
          <img src={all_imgs.england} alt="england"/>
        ) : (
          <div>English</div>
        )}
      </button>
    </div>
  );

  return (
    <Dropdown
      overlay={items}
      trigger={['click']}
      overlayStyle={{ minWidth: '150px', marginTop: '10px'  }}
      overlayClassName="language-dropdown"
      placement="bottomLeft"
    >
      {dropdownContent}
    </Dropdown>
  );
}

export default Language;
