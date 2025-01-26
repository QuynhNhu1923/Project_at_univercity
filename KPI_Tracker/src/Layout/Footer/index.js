import { Layout } from 'antd'
const { Footer:AntFooter } = Layout;

function Footer() {
  return (
    <>
      <AntFooter
        style={{
          textAlign: 'center',
          padding: '16px 50px'
        }}
      >Ant Design ©{new Date().getFullYear()} Created by HI_05</AntFooter>
    </>
  )
}

export default Footer;