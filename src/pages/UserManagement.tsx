import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface User {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        // TODO: API 호출로 실제 데이터 가져오기
        // const res = await usersApi.getList()
        // setUsers(res.data)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '사용자명',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => {
              // TODO: 수정 기능 구현
              message.info(`수정: ${record.username}`)
            }}
          >
            수정
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => {
              // TODO: 삭제 기능 구현
              message.info(`삭제: ${record.username}`)
            }}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>회원 관리</h1>
        <Input
          placeholder="사용자 검색"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}명`,
        }}
      />
    </div>
  )
}

export default UserManagement
