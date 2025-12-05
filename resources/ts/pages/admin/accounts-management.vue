<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'
import AddAccountDialog from '@/components/dialogs/AddAccountDialog.vue'

const router = useRouter()

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

interface Role {
  id: number
  name: string
  display_name: string
  description?: string
}

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

interface User {
  id: number
  user_name: string
  email?: string
}

const accounts = ref<Account[]>([])
const tags = ref<Tag[]>([])
const roles = ref<Role[]>([])
const users = ref<User[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// فیلترها
const selectedAccountType = ref<string | null>(null)
const selectedTagIds = ref<number[]>([])

// دیالوگ‌ها
const isAccountDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isAccountRolesDialogOpen = ref(false)
const accountToDelete = ref<Account | null>(null)
const accountToEditRoles = ref<Account | null>(null)

// فرم نقش‌های حساب
const accountRolesForm = ref<string[]>([])

// دریافت نقش‌ها
const fetchRoles = async () => {
  try {
    const response = await api.get('/api/roles')
    roles.value = response.data
  } catch (error: any) {
    console.error('Error fetching roles:', error)
  }
}

// دریافت لیست کاربران
const fetchUsers = async () => {
  try {
    const response = await api.get('/api/admin/users')
    users.value = response.data
  } catch (error: any) {
    console.error('Error fetching users:', error)
  }
}

// دریافت تگ‌ها
const fetchTags = async () => {
  try {
    const response = await api.get('/api/admin/tags')
    tags.value = response.data
  } catch (error: any) {
    console.error('Error fetching tags:', error)
  }
}

// دریافت حساب‌ها
const fetchAccounts = async () => {
  try {
    isLoading.value = true
    const params: any = {}
    
    if (selectedAccountType.value) {
      params.account_type = selectedAccountType.value
    }
    
    if (selectedTagIds.value.length > 0) {
      params.tag_ids = selectedTagIds.value
    }
    
    const response = await api.get('/api/admin/accounts', { params })
    accounts.value = response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت حساب‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// باز کردن دیالوگ ویرایش نقش‌های حساب
const openAccountRolesDialog = (account: Account) => {
  accountToEditRoles.value = account
  accountRolesForm.value = [...(account.allowed_roles || [])]
  isAccountRolesDialogOpen.value = true
}

// ذخیره نقش‌های حساب
const saveAccountRoles = async () => {
  if (!accountToEditRoles.value) return
  
  try {
    errorMessage.value = ''
    await api.post(`/api/admin/accounts/${accountToEditRoles.value.id}/sync-roles`, {
      roles: accountRolesForm.value,
    })
    successMessage.value = 'نقش‌های حساب با موفقیت به‌روزرسانی شد'
    isAccountRolesDialogOpen.value = false
    accountToEditRoles.value = null
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در به‌روزرسانی نقش‌ها'
    console.error(error)
  }
}

// ایجاد حساب جدید
const createAccount = async (formData: any) => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    
    // تبدیل tags به array of IDs
    const payload = {
      ...formData,
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

// آرشیو کردن حساب
const archiveAccount = async () => {
  if (!accountToDelete.value) return
  
  try {
    errorMessage.value = ''
    await api.patch(`/api/admin/accounts/${accountToDelete.value.id}/archive`)
    successMessage.value = 'حساب با موفقیت آرشیو شد'
    isDeleteDialogOpen.value = false
    accountToDelete.value = null
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در آرشیو حساب'
  }
}

// باز کردن دیالوگ حذف
const openDeleteDialog = (account: Account) => {
  accountToDelete.value = account
  isDeleteDialogOpen.value = true
}

// دریافت نام حساب
const getAccountDisplayName = (account: Account) => {
  return account.display_name || account.name || 'نامشخص'
}

// Watch برای فیلترها
watch([selectedAccountType, selectedTagIds], () => {
  fetchAccounts()
})

onMounted(async () => {
  // ابتدا نقش‌ها، کاربران و تگ‌ها را دریافت می‌کنیم
  await Promise.all([fetchRoles(), fetchUsers(), fetchTags()])
  // سپس حساب‌ها را دریافت می‌کنیم
  await fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>مدیریت حساب‌ها</span>
            <VBtn
              color="primary"
              @click="isAccountDialogOpen = true"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              ایجاد حساب
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

            <!-- فیلترها -->
            <VRow class="mb-4">
              <VCol
                cols="12"
                md="4"
              >
                <AppSelect
                  v-model="selectedAccountType"
                  :items="[
                    { title: 'همه', value: null },
                    { title: 'کارمند', value: 'employee' },
                    { title: 'شرکت', value: 'company' },
                    { title: 'خارجی', value: 'external' },
                    { title: 'تنخواه', value: 'petty_cash' }
                  ]"
                  label="فیلتر بر اساس نوع حساب"
                  clearable
                />
              </VCol>
              <VCol
                cols="12"
                md="8"
              >
                <AppSelect
                  v-model="selectedTagIds"
                  :items="tags"
                  item-title="name"
                  item-value="id"
                  label="فیلتر بر اساس تگ‌ها"
                  multiple
                  chips
                  clearable
                />
              </VCol>
            </VRow>

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
                  <th>نوع حساب</th>
                  <th>بانک</th>
                  <th>تگ‌ها</th>
                  <th>کاربر</th>
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
                  <td>
                    <VChip
                      size="small"
                      :color="account.account_type === 'employee' ? 'primary' : account.account_type === 'company' ? 'success' : account.account_type === 'petty_cash' ? 'info' : 'warning'"
                    >
                      {{ account.account_type === 'employee' ? 'کارمند' : account.account_type === 'company' ? 'شرکت' : account.account_type === 'petty_cash' ? 'تنخواه' : 'خارجی' }}
                    </VChip>
                  </td>
                  <td>{{ account.bank_name || '-' }}</td>
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
                  <td>{{ account.user?.user_name || '-' }}</td>
                  <td>
                    <VChip
                      size="small"
                      :color="account.is_active ? 'success' : 'error'"
                    >
                      {{ account.is_active ? 'فعال' : 'غیرفعال' }}
                    </VChip>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <VBtn
                        icon
                        size="small"
                        color="primary"
                        variant="text"
                        @click="router.push(`/admin/account-dashboard/${account.id}`)"
                        title="جزئیات حساب"
                      >
                        <VIcon icon="bx-detail" />
                      </VBtn>
                      <VBtn
                        icon
                        size="small"
                        color="info"
                        variant="text"
                        @click="openAccountRolesDialog(account)"
                        title="ویرایش نقش‌ها"
                      >
                        <VIcon icon="bx-shield" />
                      </VBtn>
                      <VBtn
                        icon
                        size="small"
                        color="error"
                        variant="text"
                        @click="openDeleteDialog(account)"
                        title="آرشیو حساب"
                      >
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </div>
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
      :roles="roles"
      :users="users"
      @submit="createAccount"
    />

    <!-- دیالوگ تایید حذف -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="400"
    >
      <VCard>
        <VCardTitle>تایید حذف</VCardTitle>
        <VDivider />
        <VCardText>
          آیا از آرشیو کردن حساب "{{ accountToDelete ? getAccountDisplayName(accountToDelete) : '' }}" اطمینان دارید؟
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="isDeleteDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="error"
            @click="archiveAccount"
          >
            حذف
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- دیالوگ ویرایش نقش‌های حساب -->
    <VDialog
      v-model="isAccountRolesDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle>ویرایش نقش‌های حساب</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="saveAccountRoles">
            <VRow>
              <VCol cols="12">
                <div class="text-body-2 mb-2">
                  حساب: <strong>{{ accountToEditRoles ? getAccountDisplayName(accountToEditRoles) : '' }}</strong>
                </div>
                <AppSelect
                  v-model="accountRolesForm"
                  :items="roles"
                  item-title="display_name"
                  item-value="name"
                  label="نقش‌های دسترسی"
                  multiple
                  chips
                  hint="نقش‌هایی که به این حساب دسترسی دارند را انتخاب کنید"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="isAccountRolesDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="primary"
            @click="saveAccountRoles"
          >
            ذخیره
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
