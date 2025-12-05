<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from '@core/composable/useCookie'
import api from '@/lib/axios'

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
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// دریافت حساب‌های تنخواه کاربر
const fetchAccounts = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // دریافت حساب‌های تنخواه که متعلق به کاربر فعلی است
    const response = await api.get('/api/admin/accounts', { 
      params: { account_type: 'petty_cash' } 
    })
    
    // فیلتر کردن حساب‌های متعلق به کاربر فعلی
    // برای کاربران عادی، فقط حساب خودشان را نشان می‌دهیم
    // برای Admin، همه حساب‌های تنخواه را نشان می‌دهیم
    const userData = useCookie('userData').value
    const isAdmin = userData?.role === 'admin'
    
    if (isAdmin) {
      accounts.value = response.data
    } else {
      // برای کاربران عادی، فقط حساب خودشان
      accounts.value = response.data.filter((acc: Account) => acc.user_id === userData?.id)
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت حساب‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// دریافت نام حساب
const getAccountDisplayName = (account: Account) => {
  if (account.display_name) return account.display_name
  if (account.user) {
    return `حساب تنخواه ${account.user.user_name}`
  }
  return account.name || 'نامشخص'
}

onMounted(async () => {
  await fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            مدیریت حساب‌های تنخواه
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
                  <th>کاربر</th>
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
                  <td>{{ account.user?.user_name || '-' }}</td>
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
  </div>
</template>
