import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, DatePicker, Space, Popconfirm, Card, Typography, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons'
import { Person } from '../entities/Person'
import dayjs from 'dayjs'

const { Title } = Typography

export default function CRM() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPeople()
  }, [])

  const loadPeople = async () => {
    setLoading(true)
    try {
      const response = await Person.list()
      if (response.success) {
        setPeople(response.data)
      }
    } catch (error) {
      console.error('Failed to load people:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (values) => {
    try {
      const personData = {
        ...values,
        birthday: values.birthday.format('YYYY-MM-DD')
      }

      let response
      if (editingPerson) {
        response = await Person.update(editingPerson._id, personData)
      } else {
        response = await Person.create(personData)
      }

      if (response.success) {
        setModalVisible(false)
        form.resetFields()
        setEditingPerson(null)
        loadPeople()
      }
    } catch (error) {
      console.error('Failed to save person:', error)
    }
  }

  const handleEdit = (person) => {
    setEditingPerson(person)
    form.setFieldsValue({
      ...person,
      birthday: dayjs(person.birthday)
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      // Note: Person.delete() might not be available, so we'll use update with a deleted flag
      // or implement a different approach based on your backend
      console.log('Delete functionality would be implemented here for ID:', id)
      // Refresh the list after deletion
      loadPeople()
    } catch (error) {
      console.error('Failed to delete person:', error)
    }
  }

  const getUpcomingBirthdays = () => {
    const today = dayjs()
    const nextMonth = today.add(30, 'day')
    
    return people.filter(person => {
      const birthday = dayjs(person.birthday)
      const thisYearBirthday = birthday.year(today.year())
      const nextYearBirthday = birthday.year(today.year() + 1)
      
      return (thisYearBirthday.isAfter(today) && thisYearBirthday.isBefore(nextMonth)) ||
             (nextYearBirthday.isAfter(today) && nextYearBirthday.isBefore(nextMonth))
    })
  }

  const calculateAge = (birthday) => {
    return dayjs().diff(dayjs(birthday), 'year')
  }

  const getDaysUntilBirthday = (birthday) => {
    const today = dayjs()
    const thisYearBirthday = dayjs(birthday).year(today.year())
    const nextYearBirthday = dayjs(birthday).year(today.year() + 1)
    
    if (thisYearBirthday.isAfter(today)) {
      return thisYearBirthday.diff(today, 'day')
    } else {
      return nextYearBirthday.diff(today, 'day')
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Birthday',
      dataIndex: 'birthday',
      key: 'birthday',
      render: (birthday) => dayjs(birthday).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.birthday).unix() - dayjs(b.birthday).unix()
    },
    {
      title: 'Age',
      key: 'age',
      render: (_, record) => calculateAge(record.birthday),
      sorter: (a, b) => calculateAge(a.birthday) - calculateAge(b.birthday)
    },
    {
      title: 'Days Until Birthday',
      key: 'daysUntil',
      render: (_, record) => {
        const days = getDaysUntilBirthday(record.birthday)
        return days === 0 ? <Badge status="processing" text="Today!" /> : days
      },
      sorter: (a, b) => getDaysUntilBirthday(a.birthday) - getDaysUntilBirthday(b.birthday)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this person?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const upcomingBirthdays = getUpcomingBirthdays()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Title level={1}>Simple CRM</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          className="mb-4"
        >
          Add Person
        </Button>
      </div>

      {upcomingBirthdays.length > 0 && (
        <Card 
          title={<><CalendarOutlined /> Upcoming Birthdays (Next 30 Days)</>}
          className="mb-6"
          size="small"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(person => (
              <div key={person._id} className="p-3 border rounded-lg">
                <div className="font-semibold">{person.name}</div>
                <div className="text-sm text-gray-600">
                  {dayjs(person.birthday).format('MMM DD')} • {getDaysUntilBirthday(person.birthday)} days
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Table
        columns={columns}
        dataSource={people}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        className="bg-white rounded-lg shadow"
      />

      <Modal
        title={editingPerson ? 'Edit Person' : 'Add New Person'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingPerson(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter the person\'s name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="birthday"
            label="Birthday"
            rules={[{ required: true, message: 'Please select the birthday' }]}
          >
            <DatePicker 
              placeholder="Select birthday"
              className="w-full"
              format="MMM DD, YYYY"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea 
              placeholder="Additional notes about this person"
              rows={3}
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button 
                onClick={() => {
                  setModalVisible(false)
                  form.resetFields()
                  setEditingPerson(null)
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPerson ? 'Update' : 'Add'} Person
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}