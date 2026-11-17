<template>
  <div class="stat-page">
    <div v-if="loading" class="tip">加载中...</div>
    <div v-else-if="error" class="tip error">{{ error }}</div>
    <template v-else>
      <table class="stat-table">
        <thead>
          <tr>
            <th>员工 \ 状态</th>
            <th>已完成</th>
            <th>评分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td class="area">{{ row.name }}</td>
            <td :class="{ zero: row.done === 0 }">{{ row.done }}</td>
            <td :class="{ zero: row.avg === null }">{{ row.avgText }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="area">合计</td>
            <td>{{ totalDone }}</td>
            <td>{{ overallAvgText }}</td>
          </tr>
        </tfoot>
      </table>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const error = ref('')
const rows = ref([])
const totalDone = ref(0)
const overallAvgText = ref('-')

function pickScore(r) {
  const s = r.score
  if (s === null || s === undefined || s === '') return null
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

function average(nums) {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function formatAvg(avg) {
  return avg === null ? '-' : avg.toFixed(2)
}

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token') || ''
    const { data: res } = await axios.post('http://localhost:3000/getadminworkstats', { token })

    if (res.status !== 200) {
      error.value = res.error || '获取统计失败'
      return
    }

    const users = (res.data && res.data.users) || []
    const repairs = (res.data && res.data.repairs) || []

    const grouped = new Map()
    users.forEach(u => grouped.set(String(u.id), []))

    repairs.forEach(r => {
      const key = String(r.userId)
      if (grouped.has(key)) grouped.get(key).push(r)
    })

    rows.value = users.map(u => {
      const list = grouped.get(String(u.id)) || []
      const done = list.length
      const scores = list.map(pickScore).filter(s => s !== null)
      const avg = average(scores)

      return {
        id: u.id,
        name: u.name || u.username,
        done,
        avg,
        avgText: formatAvg(avg)
      }
    })

    totalDone.value = rows.value.reduce((sum, row) => sum + row.done, 0)

    const allScores = []
    users.forEach(u => {
      const list = grouped.get(String(u.id)) || []
      list.forEach(r => {
        const s = pickScore(r)
        if (s !== null) allScores.push(s)
      })
    })
    overallAvgText.value = formatAvg(average(allScores))
  } catch (e) {
    error.value = e.response?.data?.error || '网络错误'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.stat-page {
  margin-top: 5vh;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}
.tip {
  padding: 20px 0;
  color: #666;
}
.tip.error {
  color: #e74c3c;
}
.stat-table {
  border-collapse: collapse;
  width: 100%;
  text-align: center;
  background-color: #fff;
}
.stat-table th,
.stat-table td {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  font-size: 14px;
}
.stat-table thead th {
  background: #fff;
  font-weight: 600;
}
.stat-table tbody tr:nth-child(even) {
  background: #fafafa;
}
.stat-table .area {
  font-weight: 600;
  background: #fff;
}
.stat-table td.zero {
  color: #c0c4cc;
}
.stat-table tfoot td {
  background: #fff;
  font-weight: 600;
}
</style>