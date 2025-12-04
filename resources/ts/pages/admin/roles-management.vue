<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'

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
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const roles = ref<Role[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// دیالوگ‌ها
const isRoleDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const roleToDelete = ref<Role | null>(null)
const editingRole = ref<Role | null>(null)

// فرم role
const roleForm = ref({
  name: '',
  display_name: '',
  description: '',
  is_active: true,
})

// دریافت role ها
const fetchRoles = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await api.get('/api/admin/roles')
    roles.value = response.data
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت role ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// باز کردن دیالوگ ایجاد role
const openCreateDialog = () => {
  editingRole.value = null
  roleForm.value = {
    name: '',
    display_name: '',
    description: '',
    is_active: true,
  }
  isRoleDialogOpen.value = true
}

// باز کردن دیالوگ ویرایش role
const openEditDialog = (role: Role) => {
  editingRole.value = role
  roleForm.value = {
    name: role.name,
    display_name: role.display_name,
    description: role.description || '',
    is_active: role.is_active,
  }
  isRoleDialogOpen.value = true
}

// ایجاد یا به‌روزرسانی role
const saveRole = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''

    if (editingRole.value) {
      // به‌روزرسانی
      await api.put(`/api/admin/roles/${editingRole.value.id}`, roleForm.value)
      successMessage.value = 'Role با موفقیت به‌روزرسانی شد'
    } else {
      // ایجاد
      await api.post('/api/admin/roles', roleForm.value)
      successMessage.value = 'Role با موفقیت ایجاد شد'
    }

    isRoleDialogOpen.value = false
    await fetchRoles()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ذخیره role'
    console.error(error)
  }
}

// باز کردن دیالوگ حذف
const openDeleteDialog = (role: Role) => {
  roleToDelete.value = role
  isDeleteDialogOpen.value = true
}

// حذف role
const deleteRole = async () => {
  if (!roleToDelete.value) return

  try {
    errorMessage.value = ''
    await api.delete(`/api/admin/roles/${roleToDelete.value.id}`)
    successMessage.value = 'Role با موفقیت حذف شد'
    isDeleteDialogOpen.value = false
    roleToDelete.value = null
    await fetchRoles()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در حذف role'
    console.error(error)
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>مدیریت Role ها</span>
        <VBtn
          color="primary"
          @click="openCreateDialog"
        >
          <VIcon
            icon="bx-plus"
            start
          />
          ایجاد Role جدید
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

        <VTable>
          <thead>
            <tr>
              <th>نام</th>
              <th>نام نمایشی</th>
              <th>توضیحات</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="role in roles"
              :key="role.id"
            >
              <td>{{ role.name }}</td>
              <td>{{ role.display_name }}</td>
              <td>{{ role.description || '-' }}</td>
              <td>
                <VChip
                  size="small"
                  :color="role.is_active ? 'success' : 'error'"
                >
                  {{ role.is_active ? 'فعال' : 'غیرفعال' }}
                </VChip>
              </td>
              <td>
                <VBtn
                  icon
                  size="small"
                  color="primary"
                  variant="text"
                  @click="openEditDialog(role)"
                >
                  <VIcon icon="bx-edit" />
                </VBtn>
                <VBtn
                  icon
                  size="small"
                  color="error"
                  variant="text"
                  @click="openDeleteDialog(role)"
                >
                  <VIcon icon="bx-trash" />
                </VBtn>
              </td>
            </tr>
            <tr v-if="roles.length === 0">
              <td
                colspan="5"
                class="text-center text-medium-emphasis"
              >
                هیچ role ای وجود ندارد
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>

    <!-- دیالوگ ایجاد/ویرایش role -->
    <VDialog
      v-model="isRoleDialogOpen"
      max-width="600"
    >
      <VCard>
        <VCardTitle>
          {{ editingRole ? 'ویرایش Role' : 'ایجاد Role جدید' }}
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

          <VForm @submit.prevent="saveRole">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="roleForm.name"
                  label="نام Role (انگلیسی)"
                  placeholder="مثال: admin, user, finance"
                  required
                  :disabled="!!editingRole"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="roleForm.display_name"
                  label="نام نمایشی"
                  placeholder="مثال: مدیر سیستم"
                  required
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="roleForm.description"
                  label="توضیحات"
                  placeholder="توضیحات اختیاری"
                  rows="3"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="roleForm.is_active"
                  label="فعال"
                  color="primary"
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
            @click="isRoleDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="primary"
            @click="saveRole"
          >
            {{ editingRole ? 'ذخیره' : 'ایجاد' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- دیالوگ تایید حذف -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="400"
    >
      <VCard>
        <VCardTitle>
          تایید حذف
        </VCardTitle>

        <VDivider />

        <VCardText>
          آیا از حذف role "{{ roleToDelete?.display_name }}" اطمینان دارید؟
          <VAlert
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            توجه: اگر این role به کاربرانی متصل باشد، نمی‌توان آن را حذف کرد.
          </VAlert>
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
            @click="deleteRole"
          >
            حذف
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>


