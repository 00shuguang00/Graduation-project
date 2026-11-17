<template>
    <div class="repair-form">
        <div class="form-container">
            <div class="form-item">
                <label class="form-label">姓名</label>
                <input class="form-input" type="text" :placeholder="userStore.name" v-model.trim="name" />
            </div>

            <div class="form-item">
                <label class="form-label">联系方式</label>
                <input class="form-input" type="text" :placeholder="userStore.phone || userStore.email"
                    v-model.trim="contact" />
                <div class="error">{{ errors.contact }}</div>
            </div>

            <div class="form-item">
                <label class="form-label">区域选择</label>
                <select class="form-select" :class="{ placeholder: !area }" v-model="area">
                    <option value="" disabled>请选择所在区域</option>
                    <option v-for="item in Areas" :key="item" :value="item">{{ item }}</option>
                </select>
                <div class="error">{{ errors.area }}</div>
            </div>

            <div class="form-item">
                <label class="form-label">所属类别</label>
                <select class="form-select" :class="{ placeholder: !category }" v-model="category">
                    <option value="" disabled>请选择报修类别</option>
                    <option v-for="item in categorys" :key="item" :value="item">{{ item }}</option>
                </select>
                <div class="error">{{ errors.category }}</div>
            </div>

            <div class="form-item">
                <label class="form-label">标题</label>
                <input class="form-input" type="text" v-model.trim="title" placeholder="请输入标题" />
                <div class="error">{{ errors.title }}</div>
            </div>

            <div class="form-item">
                <label class="form-label">具体内容</label>
                <textarea class="form-textarea" v-model.trim="content" rows="6" placeholder="请详细描述问题"></textarea>
                <div class="error">{{ errors.content }}</div>
            </div>

            <div class="form-item">
                <label class="form-label">现场图片</label>
                <input class="form-file-input" type="file" multiple accept="image/*" ref="fileInputRef"
                    @change="onFileChange" />
                <div v-if="files.length > 0" class="files">
                    <div class="files-item" v-for="(file, index) in files" :key="index">
                        <img :src="file.src" alt="预览图">
                    </div>
                </div>
            </div>

            <div class="error submit-error">{{ errors.submit }}</div>
            <button class="submit-btn" @click="submit" :disabled="loading">
                {{ loading ? "提交中..." : "提交" }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { useCounterStore } from "@/stores/counter"
import axios from "axios"

const userStore = useCounterStore()

const Areas = ["1号楼","2号楼","3号楼","道路","娱乐区域","其他"]
const categorys = ["水电维修", "门窗维修", "家具维修", "网络设备", "公共设施", "其他"]

const REGEX = {
    phone: /^[0-9]{11}$/,
    email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
}

const name = ref("")
const title = ref("")
const content = ref("")
const contact = ref("")
const area = ref("")
const category = ref("")
const fileList = ref([])
const fileInputRef = ref(null)
const loading = ref(false)
const files = ref([])

// 按字段存放错误信息，与第二个页面保持一致
const errors = reactive({
    contact: "",
    title: "",
    content: "",
    area: "",
    category: "",
    submit: "",
})

function resetErrors() {
    Object.keys(errors).forEach(key => {
        errors[key] = ""
    })
}

function onFileChange(e) {
    const selectedFiles = e.target.files
    fileList.value = selectedFiles
    files.value.forEach(item => URL.revokeObjectURL(item.src))
    files.value = []
    for (const file of selectedFiles) {
        const objectURL = URL.createObjectURL(file)
        files.value.push({
            file: file,
            src: objectURL
        })
    }
}

function validate() {
    resetErrors()
    let ok = true

    if (!area.value) {
        errors.area = "请选择所在区域"
        ok = false
    }
    if (!category.value) {
        errors.category = "请选择报修类别"
        ok = false
    }
    if (!title.value) {
        errors.title = "标题不能为空"
        ok = false
    }
    if (!content.value) {
        errors.content = "具体内容不能为空"
        ok = false
    }

    const finalContact = contact.value || userStore.phone || userStore.email
    if (!finalContact) {
        errors.contact = "请输入联系方式"
        ok = false
    } else if (!REGEX.phone.test(finalContact) && !REGEX.email.test(finalContact)) {
        errors.contact = "联系方式格式不正确"
        ok = false
    }

    return ok
}

function applyServerError(msg) {
    const text = msg || "操作失败"
    if (text.includes("区域")) {
        errors.area = text
    } else if (text.includes("类别") || text.includes("分类")) {
        errors.category = text
    } else if (text.includes("标题")) {
        errors.title = text
    } else if (text.includes("内容") || text.includes("描述")) {
        errors.content = text
    } else if (text.includes("联系方式") || text.includes("手机") || text.includes("邮箱")) {
        errors.contact = text
    } else {
        errors.submit = text
    }
}

function resetForm() {
    name.value = ""
    title.value = ""
    content.value = ""
    contact.value = ""
    area.value = ""
    category.value = ""
    fileList.value = []
    files.value.forEach(item => URL.revokeObjectURL(item.src))
    files.value = []
    if (fileInputRef.value) {
        fileInputRef.value.value = ""
    }
    resetErrors()
}

async function submit() {
    if (!validate()) return

    loading.value = true
    errors.submit = ""
    try {
        const formData = new FormData()
        formData.append("name", name.value || userStore.name)
        formData.append("title", title.value)
        formData.append("content", content.value)
        formData.append("contact", contact.value || userStore.phone || userStore.email)
        formData.append("area", area.value)
        formData.append("category", category.value)
        formData.append("id", userStore.id)
        for (let i = 0; i < files.value.length; i++) {
            const item = files.value[i]
            const file = item.file
            if (file && file.type.startsWith("image/")) {
                formData.append("img", file)
            }
        }

        const res = await axios.post("http://localhost:3000/addrepair", formData)
        if (res.data.status === 200) {
            resetForm()
            alert("提交成功")
        } else {
            applyServerError(res.data.error)
        }
    } catch (err) {
        errors.submit = "网络错误，请稍后重试"
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.repair-form {
    margin-top: 5vh;
    margin-bottom: 5vh;
    width: 100%;
    min-height: 90vh;
    box-sizing: border-box;
    padding: 3vh 20px 6vh;
    background: #f5f7fa;
}

.form-container {
    max-width: 720px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 34px 40px 36px;
    background: #ffffff;
    border: 1px solid #e8edf3;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(23, 43, 77, 0.06);
}

.form-item {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    column-gap: 18px;
    align-items: center;
    margin-bottom: 14px;
}

.form-label {
    grid-column: 1;
    grid-row: 1;
    font-size: 14px;
    font-weight: 500;
    color: #33415c;
    text-align: right;
    line-height: 1.4;
}

.form-input,
.form-textarea,
.form-select {
    grid-column: 2;
    grid-row: 1;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 13px;
    font-size: 14px;
    line-height: 1.5;
    color: #1f2937;
    background: #ffffff;
    border: 1px solid #d8e0ea;
    border-radius: 8px;
    outline: none;
}

.form-input::placeholder,
.form-textarea::placeholder {
    color: #a3aebd;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    border-color: #2f6bff;
    box-shadow: 0 0 0 3px rgba(47, 107, 255, 0.12);
}

.form-textarea {
    min-height: 150px;
    resize: vertical;
    overflow: auto;
    line-height: 1.7;
}

.form-select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 38px;
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 11px 7px;
}

.form-select.placeholder {
    color: #a3aebd;
}

.form-file-input {
    grid-column: 2;
    grid-row: 1;
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    font-size: 13px;
    color: #64748b;
    background: #f8fafc;
    border: 1px dashed #cfd9e6;
    border-radius: 8px;
}

.form-file-input::file-selector-button {
    margin-right: 12px;
    padding: 6px 14px;
    font-size: 13px;
    color: #2f6bff;
    background: #ffffff;
    border: 1px solid #cfd9e6;
    border-radius: 6px;
}

.form-file-input::file-selector-button:hover {
    border-color: #2f6bff;
    color: #1f56e0;
}

.files {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.files-item {
    width: 92px;
    height: 92px;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.files-item img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.error {
    grid-column: 2;
    grid-row: 2;
    font-size: 12.5px;
    line-height: 1.5;
    color: #e5484d;
    margin-top: 5px;
}

.error:empty {
    display: none;
}

.submit-error {
    margin: 4px 0 10px;
    text-align: center;
}

.submit-btn {
    display: block;
    width: 100%;
    padding: 13px 0;
    font-size: 15px;
    letter-spacing: 1px;
    color: #ffffff;
    background: #2f6bff;
    border: none;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(47, 107, 255, 0.28);
}

.submit-btn:hover:not(:disabled) {
    background: #1f56e0;
}

.submit-btn:active:not(:disabled) {
    background: #1a49c4;
}

.submit-btn:disabled {
    background: #9db8f5;
    box-shadow: none;
}
</style>