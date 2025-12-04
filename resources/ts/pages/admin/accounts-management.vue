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

interface Role {
  id: number
  name: string
  display_name: string
  description?: string
}

interface AccountCategory {
  id: number
  name: string
  description?: string
  accounts?: Account[]
  allowed_roles?: string[]
}

interface Account {
  id: number
  account_category_id?: number
  account_type: 'employee' | 'company' | 'external' | 'petty_cash'
  name?: string
  bank_name?: string
  account_number?: string
  user_id?: number
  user?: {
    id: number
    user_name: string
  }
  is_active: boolean
  account_category?: AccountCategory
  allowed_roles?: string[]
}

interface User {
  id: number
  user_name: string
  email?: string
}

const categories = ref<AccountCategory[]>([])
const accounts = ref<Account[]>([])
const roles = ref<Role[]>([])
const users = ref<User[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// دیالوگ‌ها
const isCategoryDialogOpen = ref(false)
const isAccountDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isCategoryRolesDialogOpen = ref(false)
const isAccountRolesDialogOpen = ref(false)
const accountToDelete = ref<Account | null>(null)
const categoryToEditRoles = ref<AccountCategory | null>(null)
const accountToEditRoles = ref<Account | null>(null)

// فرم دسته‌بندی
const categoryForm = ref({
  name: '',
  description: '',
  roles: [] as string[],
})

// فرم نقش‌های دسته‌بندی
const categoryRolesForm = ref<string[]>([])

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

// دریافت دسته‌بندی‌ها
const fetchCategories = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/api/admin/account-categories')
    categories.value = response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت دسته‌بندی‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// دریافت حساب‌ها
const fetchAccounts = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/api/accounts/for-transaction')
    accounts.value = response.data
    
    // گروه‌بندی حساب‌ها بر اساس دسته‌بندی
    // بعد از دریافت دسته‌بندی‌ها، حساب‌ها را به آنها اختصاص می‌دهیم
    if (categories.value.length > 0) {
      categories.value.forEach(category => {
        category.accounts = accounts.value.filter(acc => acc.account_category_id === category.id)
      })
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت حساب‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// ایجاد دسته‌بندی جدید
const createCategory = async () => {
  try {
    errorMessage.value = ''
    
    if (!categoryForm.value.name.trim()) {
      errorMessage.value = 'لطفاً نام دسته‌بندی را وارد کنید'
      return
    }
    
    await api.post('/api/admin/account-categories', categoryForm.value)
    successMessage.value = 'دسته‌بندی با موفقیت ایجاد شد'
    isCategoryDialogOpen.value = false
    categoryForm.value = { name: '', description: '', roles: [] }
    await fetchCategories()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ایجاد دسته‌بندی'
    console.error(error)
  }
}

// باز کردن دیالوگ ویرایش نقش‌های دسته‌بندی
const openCategoryRolesDialog = (category: AccountCategory) => {
  categoryToEditRoles.value = category
  categoryRolesForm.value = [...(category.allowed_roles || [])]
  isCategoryRolesDialogOpen.value = true
}

// ذخیره نقش‌های دسته‌بندی
const saveCategoryRoles = async () => {
  if (!categoryToEditRoles.value) return
  
  try {
    errorMessage.value = ''
    await api.post(`/api/admin/account-categories/${categoryToEditRoles.value.id}/sync-roles`, {
      roles: categoryRolesForm.value,
    })
    successMessage.value = 'نقش‌های دسته‌بندی با موفقیت به‌روزرسانی شد'
    isCategoryRolesDialogOpen.value = false
    categoryToEditRoles.value = null
    await fetchCategories()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در به‌روزرسانی نقش‌ها'
    console.error(error)
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
    // تبدیل account_category_id به null اگر خالی باشد
    const payload = {
      ...formData,
      account_category_id: formData.account_category_id || null,
    }
    console.log('Creating account with payload:', payload)
    await api.post('/api/admin/accounts', payload)
    successMessage.value = 'حساب با موفقیت ایجاد شد'
    isAccountDialogOpen.value = false
    await fetchAccounts()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ایجاد حساب'
    console.error('Error creating account:', error)
    // در صورت خطا، دیالوگ را باز نگه می‌داریم
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
const getAccountName = (account: Account) => {
  if (account.account_type === 'employee') {
    // برای حساب کارمند: نام کاربر، نام بانک، کارمند
    const parts: string[] = []
    
    if (account.user?.user_name) {
      parts.push(account.user.user_name)
    }
    
    if (account.bank_name) {
      parts.push(account.bank_name)
    }
    
    parts.push('کارمند')
    
    return parts.join('، ')
  }
  if (account.account_type === 'external' && account.name) {
    return account.name
  }
  if (account.account_type === 'company') {
    return 'حساب اصلی شرکت'
  }
  if (account.account_type === 'petty_cash' && account.user) {
    return `حساب تنخواه ${account.user.user_name}`
  }
  return 'نامشخص'
}

onMounted(async () => {
  // ابتدا نقش‌ها و کاربران را دریافت می‌کنیم
  await Promise.all([fetchRoles(), fetchUsers()])
  // سپس دسته‌بندی‌ها را دریافت می‌کنیم
  await fetchCategories()
  // سپس حساب‌ها را دریافت می‌کنیم و به دسته‌بندی‌ها اختصاص می‌دهیم
  await fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>مدیریت حساب‌ها و دسته‌بندی‌ها</span>
            <div class="d-flex gap-2">
              <VBtn
                color="primary"
                variant="outlined"
                @click="isCategoryDialogOpen = true"
              >
                <VIcon
                  start
                  icon="bx-category"
                />
                ایجاد دسته‌بندی
              </VBtn>
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
            </div>
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

            <!-- لیست دسته‌بندی‌ها و حساب‌های آنها -->
            <div
              v-for="category in categories"
              :key="category.id"
              class="mb-6"
            >
              <VCard variant="outlined">
                <VCardTitle class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <span>{{ category.name }}</span>
                    <VChip
                      size="small"
                      class="ml-2"
                    >
                      {{ category.accounts?.length || 0 }} حساب
                    </VChip>
                    <div
                      v-if="category.allowed_roles && category.allowed_roles.length > 0"
                      class="ml-2"
                    >
                      <VChip
                        v-for="roleName in category.allowed_roles"
                        :key="roleName"
                        size="small"
                        color="info"
                        variant="tonal"
                        class="mr-1"
                      >
                        {{ roles.find(r => r.name === roleName)?.display_name || roleName }}
                      </VChip>
                    </div>
                    <span
                      v-else
                      class="text-caption text-medium-emphasis ml-2"
                    >
                      بدون نقش
                    </span>
                  </div>
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    @click="openCategoryRolesDialog(category)"
                  >
                    <VIcon icon="bx-shield" />
                  </VBtn>
                </VCardTitle>
                <VCardText>
                  <VTable>
                    <thead>
                      <tr>
                        <th>نام حساب</th>
                        <th>نوع</th>
                        <th>بانک</th>
                        <th>نقش‌ها</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="account in category.accounts"
                        :key="account.id"
                      >
                        <td>{{ getAccountName(account) }}</td>
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
                              v-for="roleName in (account.allowed_roles || [])"
                              :key="roleName"
                              size="x-small"
                              color="info"
                              variant="tonal"
                            >
                              {{ roles.find(r => r.name === roleName)?.display_name || roleName }}
                            </VChip>
                            <span
                              v-if="!account.allowed_roles || account.allowed_roles.length === 0"
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
                          <div class="d-flex gap-1">
                            <VBtn
                              icon
                              size="small"
                              color="info"
                              variant="text"
                              @click="openAccountRolesDialog(account)"
                            >
                              <VIcon icon="bx-shield" />
                            </VBtn>
                            <VBtn
                              icon
                              size="small"
                              color="error"
                              variant="text"
                              @click="openDeleteDialog(account)"
                            >
                              <VIcon icon="bx-trash" />
                            </VBtn>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!category.accounts || category.accounts.length === 0">
                        <td
                          colspan="6"
                          class="text-center text-medium-emphasis"
                        >
                          حسابی در این دسته‌بندی وجود ندارد
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </div>

            <!-- حساب‌های بدون دسته‌بندی -->
            <VCard
              v-if="accounts.filter(acc => !acc.account_category_id).length > 0"
              variant="outlined"
            >
              <VCardTitle>
                حساب‌های بدون دسته‌بندی
              </VCardTitle>
              <VCardText>
                <VTable>
                  <thead>
                    <tr>
                      <th>نام حساب</th>
                      <th>نوع</th>
                      <th>بانک</th>
                      <th>نقش‌ها</th>
                      <th>وضعیت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="account in accounts.filter(acc => !acc.account_category_id)"
                      :key="account.id"
                    >
                      <td>{{ getAccountName(account) }}</td>
                      <td>
                        <VChip
                          size="small"
                          :color="account.account_type === 'employee' ? 'primary' : account.account_type === 'company' ? 'success' : 'warning'"
                        >
                          {{ account.account_type === 'employee' ? 'کارمند' : account.account_type === 'company' ? 'شرکت' : 'خارجی' }}
                        </VChip>
                      </td>
                      <td>{{ account.bank_name || '-' }}</td>
                      <td>
                        <div class="d-flex flex-wrap gap-1">
                          <VChip
                            v-for="roleName in (account.allowed_roles || [])"
                            :key="roleName"
                            size="x-small"
                            color="info"
                            variant="tonal"
                          >
                            {{ roles.find(r => r.name === roleName)?.display_name || roleName }}
                          </VChip>
                          <span
                            v-if="!account.allowed_roles || account.allowed_roles.length === 0"
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
                        <div class="d-flex gap-1">
                          <VBtn
                            icon
                            size="small"
                            color="info"
                            variant="text"
                            @click="openAccountRolesDialog(account)"
                          >
                            <VIcon icon="bx-shield" />
                          </VBtn>
                          <VBtn
                            icon
                            size="small"
                            color="error"
                            variant="text"
                            @click="openDeleteDialog(account)"
                          >
                            <VIcon icon="bx-trash" />
                          </VBtn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- دیالوگ ایجاد دسته‌بندی -->
    <VDialog
      v-model="isCategoryDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle>ایجاد دسته‌بندی جدید</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="createCategory">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="categoryForm.name"
                  label="نام دسته‌بندی"
                  required
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="categoryForm.description"
                  label="توضیحات"
                  rows="3"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="categoryForm.roles"
                  :items="roles"
                  item-title="display_name"
                  item-value="name"
                  label="نقش‌های دسترسی"
                  multiple
                  chips
                  hint="نقش‌هایی که به این دسته‌بندی دسترسی دارند را انتخاب کنید"
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
            @click="isCategoryDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="primary"
            @click="createCategory"
          >
            ایجاد
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- دیالوگ ایجاد حساب -->
    <AddAccountDialog
      v-model:is-dialog-visible="isAccountDialogOpen"
      mode="admin"
      :categories="categories"
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
          آیا از آرشیو کردن حساب "{{ accountToDelete ? getAccountName(accountToDelete) : '' }}" اطمینان دارید؟
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

    <!-- دیالوگ ویرایش نقش‌های دسته‌بندی -->
    <VDialog
      v-model="isCategoryRolesDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle>ویرایش نقش‌های دسته‌بندی</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="saveCategoryRoles">
            <VRow>
              <VCol cols="12">
                <div class="text-body-2 mb-2">
                  دسته‌بندی: <strong>{{ categoryToEditRoles?.name }}</strong>
                </div>
                <AppSelect
                  v-model="categoryRolesForm"
                  :items="roles"
                  item-title="display_name"
                  item-value="name"
                  label="نقش‌های دسترسی"
                  multiple
                  chips
                  hint="نقش‌هایی که به این دسته‌بندی دسترسی دارند را انتخاب کنید"
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
            @click="isCategoryRolesDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="primary"
            @click="saveCategoryRoles"
          >
            ذخیره
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
                  حساب: <strong>{{ accountToEditRoles ? getAccountName(accountToEditRoles) : '' }}</strong>
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

