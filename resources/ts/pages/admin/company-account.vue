<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'
import AddAccountDialog from '@/components/dialogs/AddAccountDialog.vue'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

const router = useRouter()

interface Tag {
  id: number
  name: string
  color?: string
}

interface Account {
  id: number
  account_type: 'employee' | 'company' | 'external' | 'petty_cash'
  display_name?: string
  owner_name?: string
  name?: string
  bank_name?: string
  account_number?: string
  sheba?: string
  user_id?: number
  user?: {
    id: number
    user_name: string
  }
  is_active: boolean
  tags?: Tag[]
  allowed_roles?: string[]
  description?: string
}

const accounts = ref<Account[]>([])
const tags = ref<Tag[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// دیالوگ‌ها
const isAccountDialogOpen = ref(false)

// دریافت تگ‌ها
const fetchTags = async () => {
  try {
    const response = await api.get('/api/admin/tags')
    tags.value = response.data
  } catch (error: any) {
    console.error('Error fetching tags:', error)
  }
}

// دریافت حساب‌های اصلی
const fetchAccounts = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/api/admin/accounts', { 
      params: { account_type: 'company' } 
    })
    accounts.value = response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت حساب‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// ایجاد حساب جدید
const createAccount = async (formData: any) => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    
    const payload = {
      ...formData,
      account_type: 'company',
      tags: formData.tags || [],
    }
    
    await api.post('/api/admin/accounts', payload)
    successMessage.value = 'حساب با موفقیت ایجاد شد'
    isAccountDialogOpen.value = false
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ایجاد حساب'
    console.error('Error creating account:', error)
  }
}

// دریافت نام حساب
const getAccountDisplayName = (account: Account) => {
  return account.display_name || account.name || 'نامشخص'
}

onMounted(async () => {
  await Promise.all([fetchTags()])
  await fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>مدیریت حساب‌های اصلی</span>
            <VBtn
              color="primary"
              @click="isAccountDialogOpen = true"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              ایجاد حساب اصلی
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

            <!-- Loading overlay -->
            <div
              v-if="isLoading"
              class="d-flex align-center justify-center"
              style="min-height: 200px;"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="64"
              />
            </div>

            <!-- جدول حساب‌ها -->
            <VTable v-else>
              <thead>
                <tr>
                  <th>نام نمایشی</th>
                  <th>نام صاحب حساب</th>
                  <th>بانک</th>
                  <th>شماره حساب</th>
                  <th>شماره شبا</th>
                  <th>تگ‌ها</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="account in accounts"
                  :key="account.id"
                >
                  <td>{{ getAccountDisplayName(account) }}</td>
                  <td>{{ account.owner_name || '-' }}</td>
                  <td>{{ account.bank_name || '-' }}</td>
                  <td>{{ account.account_number ? '***' : '-' }}</td>
                  <td>{{ account.sheba ? '***' : '-' }}</td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <VChip
                        v-for="tag in (account.tags || [])"
                        :key="tag.id"
                        size="x-small"
                        :color="tag.color || 'info'"
                        variant="tonal"
                      >
                        {{ tag.name }}
                      </VChip>
                      <span
                        v-if="!account.tags || account.tags.length === 0"
                        class="text-caption text-medium-emphasis"
                      >
                        -
                      </span>
                    </div>
                  </td>
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
                      color="primary"
                      size="small"
                      @click="router.push(`/admin/account-dashboard/${account.id}`)"
                    >
                      <VIcon
                        start
                        icon="bx-detail"
                      />
                      جزئیات حساب
                    </VBtn>
                  </td>
                </tr>
                <tr v-if="accounts.length === 0">
                  <td
                    colspan="8"
                    class="text-center text-medium-emphasis"
                  >
                    حسابی یافت نشد
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- دیالوگ ایجاد حساب -->
    <AddAccountDialog
      v-model:is-dialog-visible="isAccountDialogOpen"
      mode="admin"
      :tags="tags"
      :default-account-type="'company'"
      @submit="createAccount"
    />
  </div>
</template>
