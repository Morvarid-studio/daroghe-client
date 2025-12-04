<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import AddAccountDialog from '@/components/dialogs/AddAccountDialog.vue'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

interface Account {
  id: number
  bank_name?: string
  account_number?: string
  sheba?: string
  description?: string
  is_active: boolean
  status?: string
  created_at: string
}

// لیست حساب‌های کاربر
const accounts = ref<Account[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// دیالوگ افزودن حساب
const isAddAccountDialogOpen = ref(false)

// دریافت لیست حساب‌های کاربر
const fetchAccounts = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await api.get('/api/accounts')
    accounts.value = response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت حساب‌های بانکی'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// ثبت حساب جدید
const submitAccount = async (formData: any) => {
  try {
    errorMessage.value = ''
    successMessage.value = ''

    await api.post('/api/accounts', formData)
    
    successMessage.value = 'حساب بانکی با موفقیت ثبت شد'
    isAddAccountDialogOpen.value = false
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ثبت حساب بانکی'
    console.error(error)
  }
}


// آرشیو کردن حساب
const archiveAccount = async (accountId: number) => {
  try {
    errorMessage.value = ''
    // برای کاربران عادی، از update استفاده می‌کنیم که حساب قدیمی را غیرفعال می‌کند
    await api.post('/api/accounts/update', {
      is_active: false,
    })
    
    successMessage.value = 'حساب با موفقیت آرشیو شد'
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در آرشیو حساب'
    console.error(error)
  }
}

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>اطلاعات بانکی</span>
            <VBtn
              color="primary"
              @click="isAddAccountDialogOpen = true"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              افزودن حساب جدید
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VAlert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ errorMessage }}
            </VAlert>

            <VAlert
              v-if="successMessage"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              {{ successMessage }}
            </VAlert>

            <VTable v-if="!isLoading && accounts.length > 0">
              <thead>
                <tr>
                  <th>نام بانک</th>
                  <th>شماره حساب</th>
                  <th>شماره شبا</th>
                  <th>توضیحات</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="account in accounts"
                  :key="account.id"
                >
                  <td>{{ account.bank_name || '-' }}</td>
                  <td>{{ account.account_number || '-' }}</td>
                  <td>{{ account.sheba || '-' }}</td>
                  <td>{{ account.description || '-' }}</td>
                  <td>
                    <VChip
                      size="small"
                      :color="account.is_active ? 'success' : 'error'"
                    >
                      {{ account.is_active ? 'فعال' : 'غیرفعال' }}
                    </VChip>
                  </td>
                  <td>
                    <VBtn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      @click="archiveAccount(account.id)"
                    >
                      <VIcon icon="bx-trash" />
                    </VBtn>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <VAlert
              v-else-if="!isLoading && accounts.length === 0"
              type="info"
              variant="tonal"
            >
              هنوز حسابی ثبت نشده است. برای افزودن حساب جدید روی دکمه "افزودن حساب جدید" کلیک کنید.
            </VAlert>

            <div
              v-if="isLoading"
              class="text-center py-8"
            >
              <VProgressCircular
                indeterminate
                color="primary"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- دیالوگ افزودن حساب -->
    <AddAccountDialog
      v-model:is-dialog-visible="isAddAccountDialogOpen"
      mode="user"
      @submit="submitAccount"
    />
  </div>
</template>
