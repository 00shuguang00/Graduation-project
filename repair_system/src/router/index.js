import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'
import { useCounterStore } from '../stores/counter.js'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

import RootHome from '../views/RootHome.vue'
import AdminHome from '../views/AdminHome.vue'
import UserHome from '../views/UserHome.vue'


import AddAdmin from '../views/AddAdmin.vue'
import HandleMaterial from '../views/HandleMaterial.vue'
import MaterialRequest from '../views/MaterialRequest.vue'
import RepairForm from '../views/RepairForm.vue'
import RepairStatus from '../views/RepairStatus.vue'

import UserInfo from '../views/UserInfo.vue'
import Announcement from '../views/Announcement.vue'
import Statistics from '../views/Statistics.vue'
import EmployeeStats from '@/views/EmployeeStats.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/roothome',
    name: 'Roothome',
    redirect: '/roothome/addAdmin',
    component: RootHome,
    children: [
      {
        path: 'addAdmin',
        name: 'AddAdmin',
        component: AddAdmin
      },
      {
        path:'handlematerial',
        name:'HandleMaterial',
        component:HandleMaterial
      },
      {
        path:'employeestats',
        name:'EmployeeStats',
        component:EmployeeStats
      },
      {
        path:'announcement',
        name:'Announcement',
        component:Announcement
      },
      {
        path: 'userinfo',
        name: 'UserInfo',
        component: UserInfo
      },

    ]
  },
  {
    path:'/adminhome',
    name:'Adminhome',
    redirect: '/adminhome/handlerepair',
    component:AdminHome,
    children:[
      {
        path:'repairstatus',
        name:'RepairStatus2',
        component:RepairStatus
      },
      {
        path:'materialrequest',
        name:'MaterialRequest',
        component:MaterialRequest
      },
      {
        path:'statistics',
        name:'Statistics',
        component:Statistics
      },
      {
        path:'announcement',
        name:'Announcement2',
        component:Announcement
      },
      {
        path: 'userinfo',
        name: 'UserInfo2',
        component: UserInfo
      },
    ]
  },
  {
    path: '/userhome',
    name: 'UserHome',
    redirect: '/userhome/repairform',
    component: UserHome,
    children: [
      {
        path: 'repairform',
        name: 'RepairForm',
        component: RepairForm
      },
      {
        path: 'repairstatus',
        name: 'RepairStatus',
        component: RepairStatus
      },
      {
        path:'announcement',
        name:'Announcement3',
        component:Announcement
      },
      {
        path: 'userinfo',
        name: 'UserInfo3',
        component: UserInfo
      },
    ]
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (to.path === '/login' || to.path === '/register') {
    return true
  }
  const token = localStorage.getItem('token')
  if (!token) {
    return '/login'
  }

  try {
    const res = await axios.post('http://localhost:3000/login', { token })
    const user = res.data.data
    console.log('User info from server:', user)
    const newToken = user.token
    localStorage.setItem('token', newToken)
    const userStore = useCounterStore()
    userStore.setUserInfo({
      id: user.id,
      name: user.name,
      image: user.image,
      phone: user.phone,
      email: user.email,
      role: user.role,
      image: user.image,
      token: newToken
    })
    const roleHomeMap = {
      user:  '/userhome',
      admin: '/adminhome',
      root:  '/roothome'
    }
    const homePath = roleHomeMap[user.role]
    if (!homePath) {
      return '/login'
    }
    if (!to.path.startsWith(homePath)) {
      return homePath
    }

    return true
  } catch (error) {
    console.error(error)
    localStorage.removeItem('token')
    return '/login'
  }
})

export default router