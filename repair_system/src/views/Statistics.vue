<template>
  <div class="stat-page">
    <div v-if="loading" class="tip">加载中...</div>
    <div v-else-if="error" class="tip error">{{ error }}</div>

    <template v-else>
      <table class="stat-table">
        <thead>
          <tr>
            <th>区域 \ 类型</th>
            <th v-for="c in categorys" :key="c">{{ c }}</th>
            <th>合计</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.area">
            <td class="area">{{ row.area }}</td>
            <td v-for="(n, i) in row.counts" :key="i" :class="{ zero: n === 0 }">{{ n }}</td>
            <td class="total">{{ row.total }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="area">合计</td>
            <td v-for="(n, i) in columnTotals" :key="i">{{ n }}</td>
            <td class="total">{{ total }}</td>
          </tr>
        </tfoot>
      </table>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const AREAS = ['1号楼', '2号楼', '3号楼', '道路', '娱乐区域', '其他']
const CATEGORYS = ['水电维修', '门窗维修', '家具维修', '网络设备', '公共设施', '其他']

const loading = ref(true)
const error = ref('')
const categorys = ref([])
const rows = ref([])
const columnTotals = ref([])
const total = ref(0)

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token') || ''
    const { data: res } = await axios.post('http://localhost:3000/getadminrepairstats', { token })
    if (res.status !== 200) {
      error.value = res.error || '获取统计失败'
      return
    }
    const list = res.data || []

    categorys.value = CATEGORYS
    rows.value = AREAS.map(area => {
      const counts = CATEGORYS.map(c => {
        const hit = list.find(r => r.area === area && r.category === c)
        return hit ? Number(hit.total) : 0
      })
      return {
        area,
        counts,
        total: counts.reduce((a, b) => a + b, 0)
      }
    })
    columnTotals.value = CATEGORYS.map((_, i) =>
      rows.value.reduce((sum, row) => sum + row.counts[i], 0)
    )
    total.value = rows.value.reduce((sum, row) => sum + row.total, 0)
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
.stat-page h2 {
  margin-bottom: 16px;
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
.stat-table .total {
  font-weight: 600;
  color: #409eff;
}
.stat-table tfoot td {
  background: #fff;
  font-weight: 600;
}
.sum {
  margin-top: 12px;
  color: #666;
}
</style>