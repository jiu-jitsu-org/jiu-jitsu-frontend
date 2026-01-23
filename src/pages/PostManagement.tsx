import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Tag, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface Post {
  id: string
  title: string
  author: string
  category: string
  views: number
  likes: number
  createdAt: string
  status: 'active' | 'deleted'
}

const PostManagement = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        // TODO: API 호출로 실제 데이터 가져오기
        // const res = await postsApi.getList()
        // setPosts(res.data)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const columns: ColumnsType<Post> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '작성자',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '조회수',
      dataIndex: 'views',
      key: 'views',
    },
    {
      title: '좋아요',
      dataIndex: 'likes',
      key: 'likes',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Post['status']) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '활성' : '삭제됨'}
        </Tag>
      ),
    },
    {
      title: '작성일',
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
              // TODO: 상세 페이지/모달 구현
              message.info(`상세: ${record.title}`)
            }}
          >
            상세
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => {
              // TODO: 삭제 API 연동
              message.info(`삭제: ${record.title}`)
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
        <h1>게시글 관리</h1>
        <Input
          placeholder="게시글 검색"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        dataSource={posts}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `총 ${total}개`,
        }}
      />
    </div>
  )
}

export default PostManagement
