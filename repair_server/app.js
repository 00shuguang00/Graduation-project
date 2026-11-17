//引入
const express = require('express')
const multer = require('multer')
const path = require('path')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcryptjs')
//使用
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
//jwt常数
const JWT_SECRET = 'repair_system_secret_key_2026'
const TOKEN_EXPIRES = '12h'
//bcrypt 加盐轮数
const SALT_ROUNDS = 10
//mysql配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '20060817',
  database: 'repair_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
//路径
const uploadDir = path.join(__dirname, 'uploads')
//放图片
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const randomName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext
    cb(null, randomName)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const ext = path.extname(file.originalname).toLowerCase()
  const mime = file.mimetype
  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件'), false)
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
})
//正则
const REGEX = {
  phone: /^[0-9]{11}$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  username: /^(?!\d+$)(?![0-9_])[a-zA-Z0-9_\u4e00-\u9fa5]{2,12}$/,
  password: /^[A-Za-z0-9@_.]{5,11}$/
}
const keyword = []
//密码哈希与校验：数据库只保存 bcrypt 加盐哈希，不再保存明文
function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

function checkPassword(plain, stored) {
  if (!plain || !stored) return Promise.resolve(false)
  return bcrypt.compare(plain, stored)
}
//jwt
function generateToken(user) {
  return jwt.sign(
    { u_name: user.u_name, password: user.password },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES }
  )
}

async function getUserByToken(token) {
  try {
    const contact = jwt.verify(token, JWT_SECRET)
    if (!contact) return null
    const sql = 'SELECT * FROM users WHERE u_name = ? AND password = ?'
    const values = [contact.u_name, contact.password]
    const [rows] = await pool.execute(sql, values)
    return rows.length > 0 ? rows[0] : null
  } catch (error) {
    return null
  }
}
//注册函数
async function registerUser({ u_name, phone, email, password, role = 'user' }) {
  if (!u_name || !password) {
    return { error: '参数缺失，u_name和password为必填项' }
  }
  if (!phone && !email) {
    return { error: '参数缺失，phone和email必须提供至少一个' }
  }
  if (!REGEX.username.test(u_name)) {
    return { error: '用户名格式不符合要求' }
  }
  if (!REGEX.password.test(password)) {
    return { error: '密码格式不符合要求' }
  }
  if (phone && !REGEX.phone.test(phone)) {
    return { error: '手机号格式不正确' }
  }
  if (email && !REGEX.email.test(email)) {
    return { error: '邮箱格式不正确' }
  }

  const checks = []
  const nameSql = 'SELECT u_id FROM users WHERE u_name = ?'
  const nameValues = [u_name]
  checks.push(
    pool.execute(nameSql, nameValues).then(([rows]) => rows.length > 0 ? 'u_name已存在' : null)
  )

  if (phone) {
    const phoneSql = 'SELECT u_id FROM users WHERE phone = ?'
    const phoneValues = [phone]
    checks.push(
      pool.execute(phoneSql, phoneValues).then(([rows]) => rows.length > 0 ? 'phone已存在' : null)
    )
  }

  if (email) {
    const emailSql = 'SELECT u_id FROM users WHERE email = ?'
    const emailValues = [email]
    checks.push(
      pool.execute(emailSql, emailValues).then(([rows]) => rows.length > 0 ? 'email已存在' : null)
    )
  }

  const results = await Promise.all(checks)
  const conflict = results.find(r => r !== null)
  if (conflict) {
    return { error: conflict }
  }

  const sql = 'INSERT INTO users (u_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)'
  const passwordHash = await hashPassword(password)
  const values = [u_name, phone || null, email || null, passwordHash, role]
  const [result] = await pool.execute(sql, values)

  return {
    message: '注册成功',
    u_id: result.insertId,
    u_name,
    role
  }
}
//暴露图片文件夹
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
//注册
app.post('/register', async (req, res) => {
  const { u_name, phone, email, password } = req.body
  const result = await registerUser({ u_name, phone, email, password, role: 'user' })
  if (result.error) {
    return res.json({ status: 400, ...result })
  }
  //注册成功后直接签发 token，结构与 /login 保持一致，前端可直接写入 localStorage
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE u_id = ?', [result.u_id])
    const user = rows[0]
    const token = generateToken(user)
    return res.json({
      status: 200,
      message: result.message,
      u_id: result.u_id,
      u_name: result.u_name,
      role: result.role,
      data: {
        id: user.u_id,
        name: user.u_name,
        image: user.image,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: token
      }
    })
  } catch (err) {
    return res.json({ status: 500, error: '注册成功，但签发token失败' })
  }
})
//登录
app.post('/login', async (req, res) => {
  const { account, password, token } = req.body
  if (token) {
    const user = await getUserByToken(token)
    if (!user) {
      return res.json({ status: 404, error: '无效的token' })
    }
    const newToken = generateToken(user)
    return res.json({
      status: 200,
      data: {
        id: user.u_id,
        name: user.u_name,
        image: user.image,
        phone: user.phone,
        email: user.email,
        role: user.role,
        image: user.image,
        token: newToken
      }
    })
  }

  if (!account || !password) {
    return res.json({ status: 400, error: '参数缺失，需要account和password' })
  }

  let field
  if (REGEX.phone.test(account)) {
    field = 'phone'
  } else if (REGEX.email.test(account)) {
    field = 'email'
  } else if (REGEX.username.test(account)) {
    field = 'u_name'
  } else {
    return res.json({ status: 400, error: '账号格式不符合手机号、邮箱或用户名规范' })
  }

  const sql = `SELECT * FROM users WHERE ${field} = ?`
  const values = [account]
  const [rows] = await pool.execute(sql, values)

  if (rows.length === 0) {
    return res.json({ status: 401, error: '账号或密码错误' })
  }

  const passwordMatched = await checkPassword(password, rows[0].password)
  if (!passwordMatched) {
    return res.json({ status: 401, error: '账号或密码错误' })
  }

  const user = rows[0]
  const tokenStr = generateToken(user)
  const { password: _passwordMasked, ...loggedUser } = user
  console.log('User logged in:', loggedUser)
  res.json({
    status: 200,
    data: {
      id: user.u_id,
      name: user.u_name,
      image: user.image,
      phone: user.phone,
      email: user.email,
      role: user.role,
      image: user.image,
      token: tokenStr
    }
  })
})
//添加管理员
app.post('/addadmin', async (req, res) => {
  const { token, u_name, phone, email, password } = req.body

  if (!token) {
    return res.json({ status: 400, error: '未提供token' })
  }

  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限不足' })
  }

  const result = await registerUser({ u_name, phone, email, password, role: 'admin' })
  res.json({ status: result.error ? 400 : 200, ...result })
})
//添加报修
app.post('/addrepair', upload.array('img', 10), async (req, res) => {
  try {
    const { area, category, title, content, name, id, contact } = req.body
    const files = req.files || []
    if (!title || !content || !name || !id || !contact) {
      return res.json({ status: 400, error: '缺少必填字段' })
    }
    if (!REGEX.username.test(name)) {
      return res.json({ status: 400, error: 'name校验失败' })
    }
    if (!REGEX.phone.test(contact) && !REGEX.email.test(contact)) {
      return res.json({ status: 400, error: 'contact校验失败（须为手机号或邮箱）' })
    }

    const imgNames = files.map(file => file.filename)
    const r_images = JSON.stringify(imgNames)

    const sql = `
      INSERT INTO repairs
      (area, category, r_title, r_content, u_name, u_id, u_contact, r_images) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const values = [area, category, title, content, name, id, contact, r_images]

    const [result] = await pool.execute(sql, values)

    res.json({
      status: 200,
      message: '数据添加成功',
      insertId: result.insertId,
      images: imgNames
    })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
//处理报修
app.post('/handlerepair', upload.array('img', 10), async (req, res) => {
  try {
    const { id, f_title, f_content, f_name, f_id, f_contact } = req.body
    const files = req.files || []

    if (!id || !f_title || !f_content || !f_name || !f_contact) {
      return res.json({ status: 400, error: '缺少必填字段' })
    }
    if (!REGEX.username.test(f_name)) {
      return res.json({ status: 400, error: 'name校验失败' })
    }
    if (!REGEX.phone.test(f_contact) && !REGEX.email.test(f_contact)) {
      return res.json({ status: 400, error: 'contact校验失败（须为手机号或邮箱）' })
    }

    const imgNames = files.map(file => file.filename)
    const r_images = JSON.stringify(imgNames)

    const sql = `
      UPDATE repairs
      SET f_title = ?, f_content = ?, f_name = ?, f_id = ?, f_contact = ?,
          f_images = ?, status = 1
      WHERE id = ?
    `
    const values = [
      f_title,
      f_content,
      f_name,
      f_id,
      f_contact,
      r_images,
      id
    ]
    const [result] = await pool.execute(sql, values)
    if (result.affectedRows === 0) {
      return res.json({ status: 404, error: '未找到对应报修记录', id })
    }
    res.json({
      status: 200,
      message: '处理成功',
      affectedRows: result.affectedRows,
      images: imgNames
    })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
//获取全部报修
app.post('/getrepair', async (req, res) => {
  const { token } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'admin') {
    return res.json({ status: 403, error: '权限错误' })
  }
  try {
    const sql = `
      SELECT *
      FROM repairs
      ORDER BY status ASC, id ASC
    `
    const [rows] = await pool.execute(sql)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
//用户获取自己的报修
app.post('/usergetrepair', async (req, res) => {
  try {
    const userId = req.body.id
    if (!userId) {
      return res.json({ status: 400, error: '缺少用户ID' })
    }
    const sql = `SELECT * FROM repairs WHERE u_id = ? ORDER BY status ASC, id ASC`
    const values = [userId]
    const [rows] = await pool.execute(sql, values)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: '错误' })
  }
})
//获取报修详情
app.post('/idgetrepair', async (req, res) => {
  const { id } = req.body
  try {
    const sql = `SELECT * FROM repairs WHERE id = ? ORDER BY status ASC, id ASC`
    const values = [id]
    const [rows] = await pool.execute(sql, values)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: '错误' })
  }
})
//撤销报修
app.post('/iddeleterepair', async (req, res) => {
  const { id } = req.body
  try {
    const sql = 'DELETE FROM repairs WHERE id = ?'
    const values = [id]
    const [result] = await pool.execute(sql, values)
    if (result.affectedRows > 0) {
      res.json({ status: 200, success: true, message: '撤回报修成功' })
    } else {
      res.json({ status: 404, success: false, message: '未找到该报修记录' })
    }
  } catch (err) {
    res.json({ status: 500, success: false, message: '服务器错误' })
  }
})
//评价报修
app.post('/userreview', async (req, res) => {
  const { title, content, score, id } = req.body
  try {
    const sql = 'UPDATE repairs SET review_title = ?, review_content = ?, review_score = ?, status = 2 WHERE id = ?'
    const values = [title, content, score, id]
    await pool.execute(sql, values)
    res.json({ status: 200, success: true, message: '评价提交成功' })
  } catch (err) {
    console.log(err)
    res.json({ status: 500, success: false, message: '服务器错误' })
  }
})
//添加材料申请
app.post('/addmaterial', upload.array('img', 10), async (req, res) => {
  try {
    const { u_id, a_name, material, reason, a_contact, images } = req.body
    const files = req.files || []
    const imgNames = files.length
      ? files.map(file => file.filename)
      : (images ? (Array.isArray(images) ? images : [images]) : [])
    const r_images = JSON.stringify(imgNames)

    const sql = `
      INSERT INTO material
      (u_id, material, reason, a_name, a_contact, images) 
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const values = [u_id, material, reason, a_name, a_contact, r_images]

    const [result] = await pool.execute(sql, values)

    res.json({
      status: 200,
      message: '数据添加成功',
      images: imgNames
    })
  } catch (err) {
    console.log('111')
    console.log(err)
    res.json({ status: 500, error: 'catch' })
  }
})
//获取全部材料申请
app.post('/getmaterial', async (req, res) => {
  const { token } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }
  try {
    const sql = `
      SELECT *
      FROM material
      ORDER BY status ASC, id ASC
    `
    const [rows] = await pool.execute(sql)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 获取材料申请详情
app.post('/idmaterialapply', async (req, res) => {
  const { id } = req.body
  try {
    const sql = 'SELECT * FROM material WHERE id = ?'
    const [rows] = await pool.execute(sql, [id])
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 同意材料申请
app.post('/agreematerial', async (req, res) => {
  const { id } = req.body
  try {
    const sql = 'UPDATE material SET status = 1 WHERE id = ?'
    const [result] = await pool.execute(sql, [id])
    if (result.affectedRows === 0) {
      return res.json({ status: 404, error: '未找到该申请' })
    }
    res.json({ status: 200, message: '已同意' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 驳回材料申请
app.post('/rejectmaterial', async (req, res) => {
  const { id } = req.body
  try {
    const sql = 'UPDATE material SET status = 2 WHERE id = ?'
    const [result] = await pool.execute(sql, [id])
    if (result.affectedRows === 0) {
      return res.json({ status: 404, error: '未找到该申请' })
    }
    res.json({ status: 200, message: '已驳回' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 获取公告列表
app.post('/getannouncement', async (req, res) => {
  const { token } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }

  try {
    let sql
    let values = []

    if (operator.role === 'root') {
      sql = `
        SELECT *
        FROM announcement
        ORDER BY is_top DESC, created_at DESC
      `
    } else {
      sql = `
        SELECT *
        FROM announcement
        WHERE status = 1
          AND target IN (?, 'all')
        ORDER BY is_top DESC, created_at DESC
      `
      values = [operator.role]
    }

    const [rows] = await pool.execute(sql, values)
    res.json({ status: 200, data: rows })
  } catch (err) {
    console.error('getannouncement error:', err)
    res.json({ status: 500, error: '获取公告列表失败' })
  }
})

// 发布公告
app.post('/addannouncement', async (req, res) => {
  const { token, title, content, target } = req.body
  console.log('Received request to add announcement:', { token, title, content, target })
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }
  if (!title || !content) {
    return res.json({ status: 400, error: '缺少必填字段' })
  }
  const allow = ['all', 'user', 'admin']
  const t = allow.includes(target) ? target : 'all'
  try {
    const sql = 'INSERT INTO announcement (title, content, target) VALUES (?, ?, ?)'
    const [result] = await pool.execute(sql, [title, content, t])
    res.json({ status: 200, message: '发布成功', id: result.insertId })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 获取公告详情
app.post('/idannouncement', async (req, res) => {
  const { token, id } = req.body
  console.log('Received request to get announcement details:', { token, id })
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (!id) {
    return res.json({ status: 400, error: '缺少公告ID' })
  }

  try {
    let sql
    let values

    if (operator.role === 'root') {
      sql = 'SELECT * FROM announcement WHERE id = ?'
      values = [id]
    } else {
      sql = `
        SELECT * FROM announcement
        WHERE id = ? AND status = 1 AND target IN (?, 'all')
      `
      values = [id, operator.role]
    }

    const [rows] = await pool.execute(sql, values)
    if (rows.length === 0) {
      return res.json({ status: 404, error: '公告不存在或无权查看' })
    }

    res.json({ status: 200, data: rows[0] })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 置顶公告
app.post('/topannouncement', async (req, res) => {
  const { token, id } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }
  if (!id) {
    return res.json({ status: 400, error: '缺少公告ID' })
  }

  try {
    const [check] = await pool.execute(
      'SELECT id FROM announcement WHERE id = ?',
      [id]
    )
    if (check.length === 0) {
      return res.json({ status: 404, error: '公告不存在' })
    }
    await pool.execute(
      'UPDATE announcement SET is_top = 0 WHERE id != ?',
      [id]
    )
    await pool.execute(
      'UPDATE announcement SET is_top = 1 WHERE id = ?',
      [id]
    )

    res.json({ status: 200, message: '置顶成功' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 取消置顶
app.post('/untopannouncement', async (req, res) => {
  const { token, id } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }
  if (!id) {
    return res.json({ status: 400, error: '缺少公告ID' })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE announcement SET is_top = 0 WHERE id = ?',
      [id]
    )
    if (result.affectedRows === 0) {
      return res.json({ status: 404, error: '公告不存在' })
    }

    res.json({ status: 200, message: '取消置顶成功' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 修改手机号
app.post('/updatephone', async (req, res) => {
  const { token, password, phone } = req.body
  const user = await getUserByToken(token)
  if (!user) return res.json({ status: 401, error: '无效的token' })
  if (!password) return res.json({ status: 400, error: '请输入当前密码' })
  if (!(await checkPassword(password, user.password))) return res.json({ status: 400, error: '当前密码错误' })
  if (!phone) return res.json({ status: 400, error: '请输入手机号' })
  if (!REGEX.phone.test(phone)) return res.json({ status: 400, error: '手机号格式不正确' })

  try {
    const [rows] = await pool.execute(
      'SELECT u_id FROM users WHERE phone = ? AND u_id != ?',
      [phone, user.u_id]
    )
    if (rows.length > 0) return res.json({ status: 400, error: '该手机号已被使用' })

    await pool.execute('UPDATE users SET phone = ? WHERE u_id = ?', [phone, user.u_id])
    res.json({ status: 200, message: '手机号修改成功' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 修改邮箱
app.post('/updateemail', async (req, res) => {
  const { token, password, email } = req.body
  const user = await getUserByToken(token)
  if (!user) return res.json({ status: 401, error: '无效的token' })
  if (!password) return res.json({ status: 400, error: '请输入当前密码' })
  if (!(await checkPassword(password, user.password))) return res.json({ status: 400, error: '当前密码错误' })
  if (!email) return res.json({ status: 400, error: '请输入邮箱' })
  if (!REGEX.email.test(email)) return res.json({ status: 400, error: '邮箱格式不正确' })

  try {
    const [rows] = await pool.execute(
      'SELECT u_id FROM users WHERE email = ? AND u_id != ?',
      [email, user.u_id]
    )
    if (rows.length > 0) return res.json({ status: 400, error: '该邮箱已被使用' })

    await pool.execute('UPDATE users SET email = ? WHERE u_id = ?', [email, user.u_id])
    res.json({ status: 200, message: '邮箱修改成功' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 修改密码
app.post('/updatepassword', async (req, res) => {
  const { token, password, newPassword } = req.body
  const user = await getUserByToken(token)
  if (!user) return res.json({ status: 401, error: '无效的token' })
  if (!password) return res.json({ status: 400, error: '请输入当前密码' })
  if (!(await checkPassword(password, user.password))) return res.json({ status: 400, error: '当前密码错误' })
  if (!newPassword) return res.json({ status: 400, error: '请输入新密码' })
  if (!REGEX.password.test(newPassword)) {
    return res.json({ status: 400, error: '新密码格式不符合要求（5-11位字母数字@_.）' })
  }
  if (await checkPassword(newPassword, user.password)) {
    return res.json({ status: 400, error: '新密码不能与当前密码相同' })
  }

  try {
    const newPasswordHash = await hashPassword(newPassword)
    await pool.execute('UPDATE users SET password = ? WHERE u_id = ?', [newPasswordHash, user.u_id])
    const newToken = generateToken({ u_name: user.u_name, password: newPasswordHash })
    res.json({ status: 200, message: '密码修改成功', data: { token: newToken } })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 修改头像
app.post('/updateavatar', upload.single('img'), async (req, res) => {
  const { token } = req.body
  const user = await getUserByToken(token)
  if (!user) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (!req.file) {
    return res.json({ status: 400, error: '请选择头像图片' })
  }
  const imageName = req.file.filename
  try {
    await pool.execute('UPDATE users SET image = ? WHERE u_id = ?', [imageName, user.u_id])
    res.json({ status: 200, message: '头像更新成功', data: { image: imageName } })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
// 修改用户名
app.post('/updateusername', async (req, res) => {
  const { token, password, u_name } = req.body
  const user = await getUserByToken(token)
  if (!user) return res.json({ status: 401, error: '无效的token' })
  if (!password) return res.json({ status: 400, error: '请输入当前密码' })
  if (!(await checkPassword(password, user.password))) return res.json({ status: 400, error: '当前密码错误' })
  if (!u_name) return res.json({ status: 400, error: '请输入用户名' })
  if (!REGEX.username.test(u_name)) {
    return res.json({ status: 400, error: '用户名格式不符合要求' })
  }
  if (u_name === user.u_name) {
    return res.json({ status: 400, error: '新用户名不能与当前用户名相同' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT u_id FROM users WHERE u_name = ? AND u_id != ?',
      [u_name, user.u_id]
    )
    if (rows.length > 0) return res.json({ status: 400, error: '该用户名已被使用' })

    await pool.execute('UPDATE users SET u_name = ? WHERE u_id = ?', [u_name, user.u_id])
    const newToken = generateToken({ u_name, password: user.password })
    res.json({ status: 200, message: '用户名修改成功', data: { token: newToken } })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 获取用户列表（仅 root）
app.post('/getusers', async (req, res) => {
  const { token } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限不足' })
  }
  try {
    const sql = `
      SELECT u_id, u_name, phone, email, role, image
      FROM users
      ORDER BY u_id ASC
    `
    const [rows] = await pool.execute(sql)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})

// 删除用户
app.post('/deleteuser', async (req, res) => {
  const { token, password, u_id } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限不足' })
  }
  if (!password) {
    return res.json({ status: 400, error: '请输入管理员密码' })
  }
  if (!(await checkPassword(password, operator.password))) {
    return res.json({ status: 400, error: '管理员密码错误' })
  }
  if (Number(u_id) === Number(operator.u_id)) {
    return res.json({ status: 400, error: '不能删除自己' })
  }
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE u_id = ?', [u_id])
    if (result.affectedRows === 0) {
      return res.json({ status: 404, error: '用户不存在' })
    }
    res.json({ status: 200, message: '删除成功' })
  } catch (err) {
    res.json({ status: 500, error: 'catch' })
  }
})
//获取管理员报修统计
app.post('/getadminrepairstats', async (req, res) => {
  const { token } = req.body
  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'admin' && operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }
  try {
    const sql = `
      SELECT area, category, COUNT(*) AS total
      FROM repairs
      WHERE f_id = ?
      GROUP BY area, category
    `
    const values = [operator.u_id]
    const [rows] = await pool.execute(sql, values)
    res.json({ status: 200, data: rows })
  } catch (err) {
    res.json({ status: 500, error: '服务器内部错误' })
  }
})
// 获取管理员报修统计
app.post('/getadminworkstats', async (req, res) => {
  const { token } = req.body

  const operator = await getUserByToken(token)
  if (!operator) {
    return res.json({ status: 401, error: '无效的token' })
  }
  if (operator.role !== 'root') {
    return res.json({ status: 403, error: '权限错误' })
  }

  try {
    const userSql = `
      SELECT u_id AS id, u_name AS name
      FROM users
      WHERE role = 'admin'
      ORDER BY u_id ASC
    `
    const [users] = await pool.execute(userSql)
    const repairSql = `
      SELECT
        r.id,
        r.f_id AS userId,
        r.review_score AS score
      FROM repairs r
      INNER JOIN users u ON r.f_id = u.u_id
      WHERE u.role = 'admin'
        AND r.f_id IS NOT NULL
      ORDER BY r.id ASC
    `
    const [repairs] = await pool.execute(repairSql)

    res.json({ status: 200, data: { users, repairs } })
  } catch (err) {
    console.error('getadminworkstats error:', err)
    res.json({ status: 500, error: '服务器内部错误' })
  }
})
app.listen(3000, () => {
  console.log('111')
})