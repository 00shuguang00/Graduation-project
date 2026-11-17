import { ref } from 'vue'
import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', () => {
  const id = ref('')
  const name = ref('')
  const phone = ref('')
  const email = ref('')
  const role = ref('')
  const token  = ref('')
  const image = ref('')
  function setUserInfo(userData) {
    id.value = userData.id
    name.value = userData.name
    phone.value = userData.phone
    email.value = userData.email
    role.value = userData.role
    image.value = userData.image
  }
  function clearUserInfo() {
    id.value = ''
    name.value = ''
    phone.value = ''
    email.value = ''
    role.value = ''
    token.value = ''
    image.value = ''
  }
  return { id, name, phone, email, role, token, image, setUserInfo, clearUserInfo}
})
