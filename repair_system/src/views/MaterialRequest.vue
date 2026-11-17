<template>
    <div class="repair-form">
        <div class="form-container">
            <div class="form-item">
                <label class="form-label">姓名</label>
                <input class="form-input" type="text" :placeholder="userStore.name" v-model.trim="name" />
            </div>
            <div class="form-item">
                <label class="form-label">材料</label>
                <input class="form-input" type="text" v-model.trim="material" placeholder="请输入需要申请的材料" />
                <div class="error">{{ materialerr }}</div>
            </div>
            <div class="form-item">
                <label class="form-label">原因</label>
                <textarea class="form-textarea" v-model.trim="reason" rows="6" placeholder="请详细描述原因"></textarea>
                <div class="error">{{ reasonerr }}</div>
            </div>
            <div class="form-item">
                <label class="form-label">联系方式</label>
                <input class="form-input" type="text" :placeholder="userStore.phone || userStore.email"
                    v-model.trim="info" />
            </div>
            <div class="form-item">
                <label class="form-label">详情图片</label>
                <input class="form-file-input" type="file" multiple accept="image/*" ref="fileInputRef"
                    @change="onFileChange" />
                <div v-if="files.length > 0" class="files">
                    <div class="files-item" v-for="(file, index) in files" :key="index">
                        <img :src="file.src" alt="预览图">
                    </div>
                </div>
            </div>
            <button class="submit-btn" @click="submit" :disabled="loading">
                {{ loading ? "提交中..." : "提交" }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useCounterStore } from "@/stores/counter";
import axios from "axios";

const userStore = useCounterStore();

const name = ref("");
const material = ref("");
const reason = ref("");
const info = ref("");
const fileList = ref([]);
const fileInputRef = ref(null);
const loading = ref(false);
const materialerr = ref("");
const reasonerr = ref("");
const files = ref([]);

function onFileChange(e) {
    const selectedFiles = e.target.files;
    fileList.value = selectedFiles;
    files.value.forEach(item => URL.revokeObjectURL(item.src));
    files.value = [];
    for (const file of selectedFiles) {
        const objectURL = URL.createObjectURL(file);
        files.value.push({
            file: file,
            src: objectURL
        });
    }
}

function submit() {
    if (!material.value) {
        materialerr.value = "材料不能为空";
    } else {
        materialerr.value = "";
    }
    if (!reason.value) {
        reasonerr.value = "原因不能为空";
    } else {
        reasonerr.value = "";
    }
    if (materialerr.value || reasonerr.value) {
        return;
    }
    const formData = new FormData();
    formData.append("u_id", userStore.id);
    formData.append("a_name", name.value || userStore.name);
    formData.append("material", material.value);
    formData.append("reason", reason.value);
    formData.append("a_contact", info.value || userStore.phone || userStore.email);
    for (let i = 0; i < files.value.length; i++) {
        const item = files.value[i];
        const file = item.file;
        if (file && file.type.startsWith("image/")) {
            formData.append("img", file);
        }
    }
    loading.value = true;
    axios.post("http://localhost:3000/addmaterial", formData)
        .then((res) => {
            name.value = "";
            material.value = "";
            reason.value = "";
            info.value = "";
            fileList.value = [];
            files.value.forEach(item => URL.revokeObjectURL(item.src));
            files.value = [];
            if (fileInputRef.value) {
                fileInputRef.value.value = "";
            }
            alert("提交成功");
        })
        .catch((err) => {
            console.error(err);
            alert("提交失败，请重试");
        })
        .finally(() => {
            loading.value = false;
        });
}
</script>

<style scoped>
.repair-form {
    margin-top: 5vh;
    width: 100%;
    height: 90vh;
    background: #f5f7fa;
    padding-top: 3vh;
    margin-bottom: 20vh;
}

.form-container {
    max-width: 720px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 30px 35px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.form-item {
    margin-bottom: 22px;
}

.form-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 10px 14px;
    font-size: 14px;
    color: #000000;
    background: #f8f8f8;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    outline: none;
    box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
    border-color: #4e7cff;
    background: #ffffff;
}

.form-textarea {
    resize: none;
    overflow: auto;
    height: 20vh;
}

.form-file-input {
    display: block;
    width: 100%;
    padding: 10px 0;
    font-size: 14px;
    color: #4e5a6b;
}

.submit-btn {
    width: 100%;
    padding: 14px 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    background: linear-gradient(135deg, #4444ff, #8800ff);
    border: none;
    border-radius: 12px;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 14px rgba(78, 124, 255, 0.3);
}

.error {
    font-size: 13px;
    color: #ef4444;
    margin-top: 8px;
    min-height: 20px;
}

.files {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
}

.files-item {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e5e5;
    background: #f8f8f8;
}

.files-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
</style>