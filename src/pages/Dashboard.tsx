import { Card, Row, Col, Statistic } from 'antd'
import { UserOutlined, FileTextOutlined, LikeOutlined } from '@ant-design/icons'

const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>대시보드</h1>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="전체 회원 수"
              value={0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="전체 게시글 수"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="오늘의 활동"
              value={0}
              prefix={<LikeOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
