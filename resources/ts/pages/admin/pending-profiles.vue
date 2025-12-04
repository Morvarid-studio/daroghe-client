<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

const router = useRouter()

interface User {
  id: number
  user_name: string
  email: string
  created_at: string
}

interface PendingProfile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  phone: string
  email?: string
  birthday: string
  gender: string
  degree: string
  address: string
  military?: string
  emergency_contact_info?: string
  emergency_contact_number?: string
  education_status?: string
  marital_status?: string
  profession?: string
  languages?: string
  identity_document?: string
  resume?: string
  resume_url?: string
  profile_photo?: string
  profile_photo_url?: string
  base_salary?: number
  created_at: string
  user: User
}

const pendingProfiles = ref<PendingProfile[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedProfile = ref<PendingProfile | null>(null)
const showDetailsDialog = ref(false)
const showRejectDialog = ref(false)
const rejectionReason = ref('')

// دریافت لیست اطلاعات تایید نشده
const fetchPendingProfiles = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await api.get('/api/admin/pending-profiles')
    pendingProfiles.value = response.data.data || []
  } catch (error: any) {
    console.error('Error fetching pending profiles:', error)
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت لیست اطلاعات تایید نشده'
  } finally {
    isLoading.value = false
  }
}

// تایید اطلاعات کاربر
const approveProfile = async (userId: number) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    await api.post(`/api/admin/profiles/${userId}/approve`)
    
    successMessage.value = 'اطلاعات کاربر با موفقیت تایید شد.'
    
    // به‌روزرسانی لیست
    await fetchPendingProfiles()
    
    // پاک کردن پیام موفقیت بعد از 3 ثانیه
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error approving profile:', error)
    errorMessage.value = error.response?.data?.message || 'خطا در تایید اطلاعات کاربر'
  } finally {
    isLoading.value = false
  }
}

// رد اطلاعات کاربر
const rejectProfile = async (userId: number) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    await api.post(`/api/admin/profiles/${userId}/reject`, {
      rejection_reason: rejectionReason.value,
    })
    
    successMessage.value = 'اطلاعات کاربر رد و آرشیو شد.'
    showRejectDialog.value = false
    rejectionReason.value = ''
    
    // اگر کاربر رد شده خود کاربر فعلی است، کوکی را به‌روزرسانی کن
    const currentUser = useCookie('userData').value
    if (currentUser && currentUser.id === userId) {
      // به‌روزرسانی profile_completed به false
      currentUser.profile_completed = false
      useCookie('userData').value = currentUser
    }
    
    // به‌روزرسانی لیست
    await fetchPendingProfiles()
    
    // پاک کردن پیام موفقیت بعد از 3 ثانیه
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Error rejecting profile:', error)
    errorMessage.value = error.response?.data?.message || 'خطا در رد اطلاعات کاربر'
  } finally {
    isLoading.value = false
  }
}

// نمایش جزئیات اطلاعات
const showProfileDetails = async (profile: PendingProfile) => {
  try {
    isLoading.value = true
    // دریافت اطلاعات کامل از API
    const response = await api.get(`/api/admin/profiles/${profile.user_id}`)
    selectedProfile.value = response.data.data
    showDetailsDialog.value = true
  } catch (error: any) {
    console.error('Error fetching profile details:', error)
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت جزئیات اطلاعات'
    // در صورت خطا، از اطلاعات موجود استفاده کن
    selectedProfile.value = profile
    showDetailsDialog.value = true
  } finally {
    isLoading.value = false
  }
}

// ساخت URL کامل برای فایل‌ها
const getFileUrl = (filePath: string | undefined): string => {
  if (!filePath) return ''
  // اگر URL کامل است (شامل http یا https)، برگردان
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  // اگر با / شروع شده (URL نسبی از root)، از baseURL استفاده کن
  if (filePath.startsWith('/')) {
    const baseUrl = api.defaults.baseURL || 'http://localhost:8080'
    return `${baseUrl}${filePath}`
  }
  // در غیر این صورت، URL کامل را بساز
  const baseUrl = api.defaults.baseURL || 'http://localhost:8080'
  // اگر filePath با storage شروع نشده، اضافه کن
  if (!filePath.startsWith('storage/')) {
    return `${baseUrl}/storage/${filePath}`
  }
  return `${baseUrl}/${filePath}`
}

// تبدیل مقادیر enum به فارسی
const getGenderText = (gender: string) => {
  return gender === 'Male' ? 'مرد' : 'زن'
}

const getDegreeText = (degree: string) => {
  const degrees: Record<string, string> = {
    'Diploma': 'دیپلم',
    'Associate': 'کاردانی',
    'Bachelor': 'لیسانس',
    'Master': 'فوق لیسانس',
    'PhD': 'دکترا',
  }
  return degrees[degree] || degree
}

const getEducationStatusText = (status: string | undefined) => {
  if (!status) return '-'
  const statuses: Record<string, string> = {
    'Studying': 'در حال تحصیل',
    'Graduated': 'فارغ‌التحصیل',
    'Dropped': 'انصراف داده',
  }
  return statuses[status] || status
}

const getMaritalStatusText = (status: string | undefined) => {
  if (!status) return '-'
  return status === 'Single' ? 'مجرد' : 'متأهل'
}

// بستن دیالوگ رد
const closeRejectDialog = () => {
  showRejectDialog.value = false
  rejectionReason.value = ''
  selectedProfile.value = null
}

// باز کردن دیالوگ رد
const openRejectDialog = (profile: PendingProfile) => {
  selectedProfile.value = profile
  showRejectDialog.value = true
}

// headers برای جدول
const headers = [
  { title: 'نام کاربر', key: 'user_name', sortable: true },
  { title: 'نام و نام خانوادگی', key: 'full_name', sortable: true },
  { title: 'ایمیل', key: 'email', sortable: true },
  { title: 'شماره تماس', key: 'phone', sortable: false },
  { title: 'تاریخ ثبت', key: 'created_at', sortable: true },
  { title: 'عملیات', key: 'actions', sortable: false },
]

// محاسبه نام کامل
const getFullName = (profile: PendingProfile) => {
  return `${profile.first_name} ${profile.last_name}`
}

onMounted(() => {
  fetchPendingProfiles()
})
</script>

<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>مدیریت تایید اطلاعات کاربران</span>
        <VBtn
          color="primary"
          @click="fetchPendingProfiles"
        >
          <VIcon
            icon="bx-refresh"
            class="me-2"
          />
          به‌روزرسانی
        </VBtn>
      </VCardTitle>

      <VDivider />

      <!-- پیام‌های خطا و موفقیت -->
      <VCardText v-if="errorMessage">
        <VAlert
          type="error"
          variant="tonal"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </VAlert>
      </VCardText>

      <VCardText v-if="successMessage">
        <VAlert
          type="success"
          variant="tonal"
          closable
          @click:close="successMessage = ''"
        >
          {{ successMessage }}
        </VAlert>
      </VCardText>

      <VCardText>
        <VDataTable
          :headers="headers"
          :items="pendingProfiles"
          :loading="isLoading"
          class="text-no-wrap"
        >
          <!-- نام کاربر -->
          <template #item.user_name="{ item }">
            <div class="d-flex align-center">
              <VAvatar
                size="32"
                color="primary"
                variant="tonal"
                class="me-3"
              >
                <span>{{ item.user?.user_name?.charAt(0).toUpperCase() || 'U' }}</span>
              </VAvatar>
              <span class="font-weight-medium">{{ item.user?.user_name || '-' }}</span>
            </div>
          </template>

          <!-- نام و نام خانوادگی -->
          <template #item.full_name="{ item }">
            <span>{{ getFullName(item) }}</span>
          </template>

          <!-- ایمیل -->
          <template #item.email="{ item }">
            <span>{{ item.user?.email || '-' }}</span>
          </template>

          <!-- شماره تماس -->
          <template #item.phone="{ item }">
            <span>{{ item.phone || '-' }}</span>
          </template>

          <!-- تاریخ ثبت -->
          <template #item.created_at="{ item }">
            <span>{{ new Date(item.created_at).toLocaleDateString('fa-IR') }}</span>
          </template>

          <!-- عملیات -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-2">
              <VBtn
                color="info"
                size="small"
                variant="text"
                @click="showProfileDetails(item)"
              >
                <VIcon
                  icon="bx-show"
                  size="20"
                />
              </VBtn>
              <VBtn
                color="success"
                size="small"
                variant="text"
                @click="approveProfile(item.user_id)"
              >
                <VIcon
                  icon="bx-check"
                  size="20"
                />
              </VBtn>
              <VBtn
                color="error"
                size="small"
                variant="text"
                @click="openRejectDialog(item)"
              >
                <VIcon
                  icon="bx-x"
                  size="20"
                />
              </VBtn>
            </div>
          </template>

          <!-- حالت خالی -->
          <template #no-data>
            <div class="text-center py-8">
              <VIcon
                icon="bx-info-circle"
                size="48"
                class="text-disabled mb-4"
              />
              <p class="text-disabled">هیچ اطلاعات تایید نشده‌ای یافت نشد</p>
            </div>
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- دیالوگ نمایش جزئیات -->
    <VDialog
      v-model="showDetailsDialog"
      max-width="1000px"
      scrollable
    >
      <VCard v-if="selectedProfile">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>جزئیات کامل اطلاعات کاربر</span>
          <VBtn
            icon
            variant="text"
            @click="showDetailsDialog = false"
          >
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VRow>
            <!-- تصویر پروفایل -->
            <VCol
              v-if="selectedProfile.profile_photo_url || selectedProfile.profile_photo"
              cols="12"
              class="text-center mb-4"
            >
              <div class="mb-2">
                <span class="text-disabled text-sm d-block mb-2">تصویر پروفایل:</span>
                <VImg
                  :src="selectedProfile.profile_photo_url || getFileUrl(selectedProfile.profile_photo)"
                  max-width="200"
                  max-height="200"
                  class="mx-auto rounded"
                  style="border: 2px solid rgba(var(--v-theme-on-surface), 0.12);"
                />
              </div>
            </VCol>

            <!-- اطلاعات شخصی -->
            <VCol cols="12">
              <h3 class="mb-4">اطلاعات شخصی</h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">نام:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.first_name }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">نام خانوادگی:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.last_name }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">شماره تماس:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.phone || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">تاریخ تولد:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.birthday || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">جنسیت:</span>
                <p class="text-body-1 font-weight-medium">{{ getGenderText(selectedProfile.gender) }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">وضعیت تأهل:</span>
                <p class="text-body-1 font-weight-medium">{{ getMaritalStatusText(selectedProfile.marital_status) }}</p>
              </div>
            </VCol>
            <VCol cols="12">
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">آدرس:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.address || '-' }}</p>
              </div>
            </VCol>

            <!-- اطلاعات تحصیلی -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="mb-4">اطلاعات تحصیلی</h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">مدرک تحصیلی:</span>
                <p class="text-body-1 font-weight-medium">{{ getDegreeText(selectedProfile.degree) }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">وضعیت تحصیلی:</span>
                <p class="text-body-1 font-weight-medium">{{ getEducationStatusText(selectedProfile.education_status) }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">وضعیت نظام وظیفه:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.military || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">شماره شناسنامه:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.identity_document || '-' }}</p>
              </div>
            </VCol>

            <!-- اطلاعات شغلی -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="mb-4">اطلاعات شغلی</h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">شغل:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.profession || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">زبان‌ها:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.languages || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">حقوق پایه:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.base_salary ? selectedProfile.base_salary.toLocaleString('fa-IR') + ' تومان' : '-' }}</p>
              </div>
            </VCol>

            <!-- اطلاعات تماس اضطراری -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="mb-4">اطلاعات تماس اضطراری</h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">اطلاعات تماس اضطراری:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.emergency_contact_info || '-' }}</p>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-1">شماره تماس اضطراری:</span>
                <p class="text-body-1 font-weight-medium">{{ selectedProfile.emergency_contact_number || '-' }}</p>
              </div>
            </VCol>

            <!-- فایل‌ها -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="mb-4">فایل‌های آپلود شده</h3>
            </VCol>

            <VCol
              v-if="selectedProfile.resume_url || selectedProfile.resume"
              cols="12"
              md="6"
            >
              <div class="mb-4">
                <span class="text-disabled text-sm d-block mb-2">رزومه:</span>
                <VBtn
                  color="primary"
                  variant="outlined"
                  :href="selectedProfile.resume_url || getFileUrl(selectedProfile.resume)"
                  target="_blank"
                  download
                >
                  <VIcon
                    icon="bx-download"
                    class="me-2"
                  />
                  دانلود رزومه
                </VBtn>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn
            color="success"
            @click="approveProfile(selectedProfile.user_id); showDetailsDialog = false"
          >
            <VIcon
              icon="bx-check"
              class="me-2"
            />
            تایید
          </VBtn>
          <VBtn
            color="error"
            variant="outlined"
            @click="showDetailsDialog = false; openRejectDialog(selectedProfile)"
          >
            <VIcon
              icon="bx-x"
              class="me-2"
            />
            رد
          </VBtn>
          <VBtn
            variant="outlined"
            @click="showDetailsDialog = false"
          >
            بستن
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- دیالوگ رد اطلاعات -->
    <VDialog
      v-model="showRejectDialog"
      max-width="500px"
    >
      <VCard>
        <VCardTitle>رد اطلاعات کاربر</VCardTitle>

        <VDivider />

        <VCardText>
          <p class="mb-4">
            آیا از رد اطلاعات کاربر <strong>{{ selectedProfile ? getFullName(selectedProfile) : '' }}</strong> مطمئن هستید؟
          </p>
          <AppTextarea
            v-model="rejectionReason"
            label="دلیل رد (اختیاری)"
            placeholder="در صورت نیاز، دلیل رد را وارد کنید..."
            rows="3"
          />
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="closeRejectDialog"
          >
            انصراف
          </VBtn>
          <VBtn
            color="error"
            @click="selectedProfile && rejectProfile(selectedProfile.user_id)"
          >
            رد کردن
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

