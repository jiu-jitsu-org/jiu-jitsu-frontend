import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authApi.login(values)
      login(response.token, response.user)
      message.success('로그인 성공')
      navigate('/dashboard')
    } catch (error: any) {
      message.error(error.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card
        title="주짓수 커뮤니티 관리자 로그인"
        style={{ width: 400 }}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '사용자명을 입력해주세요.' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="사용자명"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
