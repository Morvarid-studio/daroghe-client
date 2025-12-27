<script setup lang="ts">
import api from '@/lib/axios'
import moment from 'jalali-moment'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

// State
const isLoading = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const profileData = ref<any>(null)
const errorMessage = ref('')
const successMessage = ref('')
const profilePhotoPreview = ref<string | null>(null)
const existingProfilePhotoUrl = ref<string | null>(null)
const existingResumeUrl = ref<string | null>(null)

// فرم
const defaultForm = {
  first_name: '',
  last_name: '',
  address: '',
  birthday: '',
  birthday_day: '',
  birthday_month: '',
  birthday_year: '',
  gender: '',
  military: '',
  degree: '',
  phone: '',
  emergency_contact_info: '',
  emergency_contact_number: '',
  education_status: '',
  marital_status: '',
  profession: '',
  languages: '',
  resume: null as File | null,
  profile_photo: null as File | null,
}

const form = ref({ ...defaultForm })

// Options
const genderOptions = [
  { title: 'مرد', value: 'Male' },
  { title: 'زن', value: 'Female' },
]

const degreeOptions = [
  { title: 'دیپلم', value: 'Diploma' },
  { title: 'کاردانی', value: 'Associate' },
  { title: 'لیسانس', value: 'Bachelor' },
  { title: 'فوق لیسانس', value: 'Master' },
  { title: 'دکترا', value: 'PhD' },
]

const educationStatusOptions = [
  { title: 'در حال تحصیل', value: 'Studying' },
  { title: 'فارغ‌التحصیل', value: 'Graduated' },
  { title: 'انصراف داده', value: 'Dropped' },
]

const maritalStatusOptions = [
  { title: 'مجرد', value: 'Single' },
  { title: 'متأهل', value: 'Married' },
]

const militaryOptions = [
  { title: 'پایان خدمت', value: 'Completed' },
  { title: 'معاف', value: 'Exempt' },
  { title: 'در حال خدمت', value: 'Serving' },
  { title: 'معافیت پزشکی', value: 'MedicalExempt' },
  { title: 'معافیت تحصیلی', value: 'EducationalExempt' },
  { title: 'معافیت کفالت', value: 'CustodyExempt' },
  { title: 'معافیت تک‌پسر', value: 'OnlySonExempt' },
]

const persianMonths = [
  { title: 'فروردین', value: '1' },
  { title: 'اردیبهشت', value: '2' },
  { title: 'خرداد', value: '3' },
  { title: 'تیر', value: '4' },
  { title: 'مرداد', value: '5' },
  { title: 'شهریور', value: '6' },
  { title: 'مهر', value: '7' },
  { title: 'آبان', value: '8' },
  { title: 'آذر', value: '9' },
  { title: 'دی', value: '10' },
  { title: 'بهمن', value: '11' },
  { title: 'اسفند', value: '12' },
]

// Helper functions
const sanitizeDigits = (value: string) => value.replace(/\D/g, '')

const handlePhoneInput = (field: 'phone' | 'emergency_contact_number') => {
  form.value[field] = sanitizeDigits(form.value[field]).slice(0, 11)
}

// تبدیل تاریخ میلادی به شمسی و استخراج روز، ماه، سال
const parseBirthdayToShamsi = (miladiDate: string) => {
  if (!miladiDate) {
    return { day: '', month: '', year: '' }
  }
  try {
    const momentDate = moment(miladiDate, 'YYYY-MM-DD')
    if (momentDate.isValid()) {
      const shamsiYear = momentDate.format('jYYYY')
      const shamsiMonth = momentDate.format('jMM')
      const shamsiDay = momentDate.format('jDD')
      return {
        day: shamsiDay,
        month: String(parseInt(shamsiMonth)),
        year: shamsiYear,
      }
    }
  } catch (error) {
    console.error('Error parsing birthday:', error)
  }
  return { day: '', month: '', year: '' }
}

// فرمت تاریخ میلادی به شمسی
const formatToJalali = (dateString: string) => {
  if (!dateString) return ''
  try {
    const momentDate = moment(dateString, 'YYYY-MM-DD')
    if (momentDate.isValid()) {
      return momentDate.format('jYYYY/jMM/jDD')
    }
    return dateString
  }
  catch (error) {
    console.error('Error converting date to jalali:', error)
    return dateString
  }
}

// تبدیل روز، ماه، سال شمسی به رشته تاریخ شمسی (Y/m/d)
const shamsiDateToString = (day: string, month: string, year: string): string => {
  if (!day || !month || !year) return ''
  const formattedDay = day.padStart(2, '0')
  const formattedMonth = month.padStart(2, '0')
  return `${year}/${formattedMonth}/${formattedDay}`
}

// دریافت اطلاعات پروفایل از API
const fetchProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.get('/api/dashboard/information/latest')
    
    if (response.data?.data) {
      profileData.value = response.data.data
      
      // پر کردن فرم با اطلاعات دریافت شده
      form.value.first_name = profileData.value.first_name || ''
      form.value.last_name = profileData.value.last_name || ''
      form.value.address = profileData.value.address || ''
      
      if (profileData.value.birthday) {
        const parsed = parseBirthdayToShamsi(profileData.value.birthday)
        form.value.birthday_day = parsed.day
        form.value.birthday_month = parsed.month
        form.value.birthday_year = parsed.year
        form.value.birthday = profileData.value.birthday
      }
      
      form.value.gender = profileData.value.gender || ''
      form.value.military = profileData.value.military || ''
      form.value.degree = profileData.value.degree || ''
      form.value.phone = profileData.value.phone || ''
      form.value.emergency_contact_info = profileData.value.emergency_contact_info || ''
      form.value.emergency_contact_number = profileData.value.emergency_contact_number || ''
      form.value.education_status = profileData.value.education_status || ''
      form.value.marital_status = profileData.value.marital_status || ''
      form.value.profession = profileData.value.profession || ''
      form.value.languages = profileData.value.languages || ''
      
      // ذخیره URL فایل‌های قبلی
      if (profileData.value.profile_photo_url) {
        existingProfilePhotoUrl.value = getFileUrl(profileData.value.profile_photo_url)
      }
      if (profileData.value.resume_url) {
        existingResumeUrl.value = getFileUrl(profileData.value.resume_url)
      }
    }
  }
  catch (error: any) {
    console.error('Error fetching profile:', error)
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت اطلاعات پروفایل'
  }
  finally {
    isLoading.value = false
  }
}

// ساخت payload برای ارسال
const buildPayload = () => {
  const formData = new FormData()

  // اضافه کردن فیلدهای متنی
  Object.entries(form.value).forEach(([key, value]) => {
    if (key === 'resume' || key === 'profile_photo') {
      return
    }

    if (key === 'birthday_day' || key === 'birthday_month' || key === 'birthday_year') {
      return
    }

    // اگر شماره تلفن تغییر نکرده، ارسال نکن (برای جلوگیری از خطای "phone has already been taken")
    if (key === 'phone' && profileData.value) {
      const originalPhone = profileData.value.phone || ''
      const currentPhone = typeof value === 'string' ? value.trim() : ''
      if (originalPhone === currentPhone) {
        return // شماره تلفن تغییر نکرده، ارسال نکن
      }
    }

    // اگر شماره تماس اضطراری تغییر نکرده، ارسال نکن
    if (key === 'emergency_contact_number' && profileData.value) {
      const originalEmergencyPhone = profileData.value.emergency_contact_number || ''
      const currentEmergencyPhone = typeof value === 'string' ? value.trim() : ''
      if (originalEmergencyPhone === currentEmergencyPhone) {
        return // شماره تماس اضطراری تغییر نکرده، ارسال نکن
      }
    }

    if (key === 'birthday' && typeof value === 'string' && value.trim()) {
      const shamsiDate = shamsiDateToString(
        form.value.birthday_day,
        form.value.birthday_month,
        form.value.birthday_year
      )
      if (shamsiDate) {
        formData.append('birthday', shamsiDate)
      }
      return
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim()
      if (trimmedValue.length > 0) {
        formData.append(key, trimmedValue)
      }
    } else if (value !== null && value !== undefined && value !== '') {
      formData.append(key, String(value))
    }
  })

  // تبدیل روز، ماه، سال به تاریخ شمسی
  const shamsiDate = shamsiDateToString(
    form.value.birthday_day,
    form.value.birthday_month,
    form.value.birthday_year
  )
  if (shamsiDate) {
    formData.append('birthday', shamsiDate)
  }

  // اضافه کردن فایل‌ها
  if (form.value.resume instanceof File) {
    formData.append('resume', form.value.resume)
  }

  if (form.value.profile_photo instanceof File) {
    formData.append('profile_photo', form.value.profile_photo)
  }

  return formData
}

// ذخیره تغییرات
const saveProfile = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = buildPayload()
    await api.post('/api/updateinformation', payload)

    successMessage.value = 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد.'
    isEditing.value = false
    
    // بارگذاری مجدد اطلاعات
    await fetchProfile()
  }
  catch (error: any) {
    console.error('Error updating profile:', error)
    let errorMsg = error.response?.data?.message || 'خطا در به‌روزرسانی اطلاعات. دوباره تلاش کنید.'
    
    // ترجمه پیام‌های خطای رایج به فارسی
    if (errorMsg.includes('phone has already been taken') || errorMsg.includes('The phone has already been taken')) {
      errorMsg = 'این شماره تلفن قبلاً توسط کاربر دیگری استفاده شده است.'
    } else if (errorMsg.includes('phone')) {
      errorMsg = 'خطا در شماره تلفن: ' + errorMsg
    }
    
    errorMessage.value = errorMsg
  }
  finally {
    isSubmitting.value = false
  }
}

// لغو ویرایش
const cancelEdit = () => {
  isEditing.value = false
  errorMessage.value = ''
  successMessage.value = ''
  
  // بازگرداندن فرم به حالت اولیه
  if (profileData.value) {
    form.value.first_name = profileData.value.first_name || ''
    form.value.last_name = profileData.value.last_name || ''
    form.value.address = profileData.value.address || ''
    
    if (profileData.value.birthday) {
      const parsed = parseBirthdayToShamsi(profileData.value.birthday)
      form.value.birthday_day = parsed.day
      form.value.birthday_month = parsed.month
      form.value.birthday_year = parsed.year
    }
    
    form.value.gender = profileData.value.gender || ''
    form.value.military = profileData.value.military || ''
    form.value.degree = profileData.value.degree || ''
    form.value.phone = profileData.value.phone || ''
    form.value.emergency_contact_info = profileData.value.emergency_contact_info || ''
    form.value.emergency_contact_number = profileData.value.emergency_contact_number || ''
    form.value.education_status = profileData.value.education_status || ''
    form.value.marital_status = profileData.value.marital_status || ''
    form.value.profession = profileData.value.profession || ''
    form.value.languages = profileData.value.languages || ''
    form.value.resume = null
    form.value.profile_photo = null
  }
  
  // پاک کردن preview
  if (profilePhotoPreview.value) {
    URL.revokeObjectURL(profilePhotoPreview.value)
    profilePhotoPreview.value = null
  }
}

// تابع برای handle کردن تغییر فایل
const handleProfilePhotoChange = (newValue: File | FileList | File[] | null) => {
  // Cleanup URL قبلی
  if (profilePhotoPreview.value) {
    URL.revokeObjectURL(profilePhotoPreview.value)
    profilePhotoPreview.value = null
  }

  // VFileInput در Vuetify 3 می‌تونه FileList یا File[] یا File برگردونه
  let file: File | null = null
  
  if (newValue instanceof File) {
    file = newValue
  } else if (newValue instanceof FileList && newValue.length > 0) {
    file = newValue[0]
  } else if (Array.isArray(newValue) && newValue.length > 0 && newValue[0] instanceof File) {
    file = newValue[0]
  }

  // ایجاد URL جدید برای preview
  if (file) {
    profilePhotoPreview.value = URL.createObjectURL(file)
    form.value.profile_photo = file
  } else {
    form.value.profile_photo = null
  }
}

// Watch برای preview عکس پروفایل
watch(() => form.value.profile_photo, (newValue) => {
  // فقط اگر File نیست (یعنی از VFileInput اومده) handle کن
  if (!(newValue instanceof File)) {
    handleProfilePhotoChange(newValue as any)
  } else if (newValue) {
    // اگر File هست، فقط preview رو update کن
    if (profilePhotoPreview.value) {
      URL.revokeObjectURL(profilePhotoPreview.value)
    }
    profilePhotoPreview.value = URL.createObjectURL(newValue)
  }
}, { immediate: true })

// محاسبه نام کامل
const fullName = computed(() => {
  if (!profileData.value) return ''
  const firstName = profileData.value.first_name || ''
  const lastName = profileData.value.last_name || ''
  return `${firstName} ${lastName}`.trim()
})

// محاسبه حروف اول برای آواتار
const avatarText = computed(() => {
  if (!fullName.value) return 'U'
  const parts = fullName.value.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return fullName.value[0].toUpperCase()
})

// تبدیل وضعیت نظام وظیفه به فارسی
const getMilitaryStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'Completed': 'پایان خدمت',
    'Exempt': 'معاف',
    'Serving': 'در حال خدمت',
    'MedicalExempt': 'معافیت پزشکی',
    'EducationalExempt': 'معافیت تحصیلی',
    'CustodyExempt': 'معافیت کفالت',
    'OnlySonExempt': 'معافیت تک‌پسر',
  }
  return statusMap[status] || status
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

onMounted(() => {
  fetchProfile()
})

onUnmounted(() => {
  if (profilePhotoPreview.value) {
    URL.revokeObjectURL(profilePhotoPreview.value)
  }
})
</script>

<template>
  <div>
    <!-- Header با عکس پروفایل -->
    <VCard class="mb-6">
      <VCardText class="text-center pt-12 pb-6">
        <div class="d-flex justify-end mb-4">
          <VBtn
            v-if="!isEditing && profileData"
            color="primary"
            variant="outlined"
            @click="isEditing = true"
          >
            <VIcon
              icon="bx-edit"
              class="me-2"
            />
            ویرایش پروفایل
          </VBtn>
        </div>

        <!-- آواتار -->
        <VAvatar
          rounded
          :size="120"
          :color="!profileData?.profile_photo_url && !profilePhotoPreview ? 'primary' : undefined"
          :variant="!profileData?.profile_photo_url && !profilePhotoPreview ? 'tonal' : undefined"
          class="mb-4"
        >
          <VImg
            v-if="profilePhotoPreview"
            :src="profilePhotoPreview"
          />
          <VImg
            v-else-if="profileData?.profile_photo_url"
            :src="profileData.profile_photo_url"
          />
          <span
            v-else
            class="text-5xl font-weight-medium"
          >
            {{ avatarText }}
          </span>
        </VAvatar>

        <!-- نام و نام خانوادگی -->
        <h4 class="text-h4 mb-2">
          {{ fullName || 'در حال بارگذاری...' }}
        </h4>

        <!-- اطلاعات اضافی -->
        <div
          v-if="profileData && !isEditing"
          class="d-flex flex-wrap justify-center gap-6 mt-4"
        >
          <span
            v-if="profileData.profession"
            class="d-flex align-center gap-2"
          >
            <VIcon
              size="20"
              icon="bx-briefcase"
            />
            <span class="text-body-1">{{ profileData.profession }}</span>
          </span>

          <span
            v-if="profileData.phone"
            class="d-flex align-center gap-2"
          >
            <VIcon
              size="20"
              icon="bx-phone"
            />
            <span class="text-body-1">{{ profileData.phone }}</span>
          </span>
        </div>
      </VCardText>
    </VCard>

    <!-- نمایش پیام‌ها -->
    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-6"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </VAlert>

    <VAlert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-6"
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </VAlert>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
      <p class="text-body-1 mt-4 text-medium-emphasis">
        در حال بارگذاری اطلاعات...
      </p>
    </div>

    <!-- محتوای پروفایل - حالت نمایش -->
    <VRow
      v-else-if="profileData && !isEditing"
    >
      <!-- ستون سمت راست - اطلاعات شخصی -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle>اطلاعات شخصی</VCardTitle>
          </VCardItem>
          <VCardText>
            <VList class="card-list">
              <VListItem
                v-if="profileData.birthday"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-calendar"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">تاریخ تولد:</span>
                  <span>{{ formatToJalali(profileData.birthday) }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.gender"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-user"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">جنسیت:</span>
                  <span>{{ profileData.gender === 'Male' ? 'مرد' : profileData.gender === 'Female' ? 'زن' : profileData.gender }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.marital_status"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-heart"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">وضعیت تأهل:</span>
                  <span>{{ profileData.marital_status === 'Single' ? 'مجرد' : profileData.marital_status === 'Married' ? 'متأهل' : profileData.marital_status }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.military"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-shield"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">وضعیت نظام وظیفه:</span>
                  <span>{{ getMilitaryStatusText(profileData.military) }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.address"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-start gap-2">
                  <VIcon
                    icon="bx-map"
                    size="20"
                    class="mt-1"
                  />
                  <div>
                    <span class="text-body-1 font-weight-medium me-2">آدرس:</span>
                    <span>{{ profileData.address }}</span>
                  </div>
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>

        <!-- کارت اطلاعات تماس -->
        <VCard>
          <VCardItem>
            <VCardTitle>اطلاعات تماس</VCardTitle>
          </VCardItem>
          <VCardText>
            <VList class="card-list">
              <VListItem
                v-if="profileData.phone"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-phone"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">شماره تماس:</span>
                  <span>{{ profileData.phone }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.emergency_contact_info"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-user-check"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">تماس اضطراری:</span>
                  <span>{{ profileData.emergency_contact_info }}</span>
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="profileData.emergency_contact_number"
                class="px-0"
              >
                <VListItemTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="bx-phone-call"
                    size="20"
                  />
                  <span class="text-body-1 font-weight-medium me-2">شماره تماس اضطراری:</span>
                  <span>{{ profileData.emergency_contact_number }}</span>
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- ستون سمت چپ - اطلاعات تحصیلی و شغلی -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- اطلاعات تحصیلی -->
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle>اطلاعات تحصیلی</VCardTitle>
          </VCardItem>
          <VCardText>
            <VRow>
              <VCol
                v-if="profileData.degree"
                cols="12"
                md="6"
              >
                <div class="d-flex align-center gap-2 mb-4">
                  <VIcon
                    icon="bx-graduation"
                    size="20"
                    color="primary"
                  />
                  <div>
                    <div class="text-body-2 text-disabled">
                      آخرین مدرک تحصیلی
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ profileData.degree }}
                    </div>
                  </div>
                </div>
              </VCol>

              <VCol
                v-if="profileData.education_status"
                cols="12"
                md="6"
              >
                <div class="d-flex align-center gap-2 mb-4">
                  <VIcon
                    icon="bx-book"
                    size="20"
                    color="primary"
                  />
                  <div>
                    <div class="text-body-2 text-disabled">
                      وضعیت تحصیل
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ profileData.education_status === 'Studying' ? 'در حال تحصیل' : profileData.education_status === 'Graduated' ? 'فارغ‌التحصیل' : profileData.education_status === 'Dropped' ? 'انصراف داده' : profileData.education_status }}
                    </div>
                  </div>
                </div>
              </VCol>

              <VCol
                v-if="profileData.languages"
                cols="12"
              >
                <div class="d-flex align-center gap-2 mb-4">
                  <VIcon
                    icon="bx-world"
                    size="20"
                    color="primary"
                  />
                  <div>
                    <div class="text-body-2 text-disabled">
                      زبان‌ها
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ profileData.languages }}
                    </div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- اطلاعات شغلی -->
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle>اطلاعات شغلی</VCardTitle>
          </VCardItem>
          <VCardText>
            <div
              v-if="profileData.profession"
              class="d-flex align-center gap-2 mb-4"
            >
              <VIcon
                icon="bx-briefcase"
                size="20"
                color="primary"
              />
              <div>
                <div class="text-body-2 text-disabled">
                  حوزه فعالیت
                </div>
                <div class="text-body-1 font-weight-medium">
                  {{ profileData.profession }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- فایل‌ها -->
        <VCard>
          <VCardItem>
            <VCardTitle>فایل‌های ضمیمه</VCardTitle>
          </VCardItem>
          <VCardText>
            <div
              v-if="profileData.resume_url"
              class="d-flex align-center justify-space-between pa-4 border rounded"
            >
              <div class="d-flex align-center gap-3">
                <VIcon
                  icon="bx-file"
                  size="32"
                  color="primary"
                />
                <div>
                  <div class="text-body-1 font-weight-medium">
                    رزومه
                  </div>
                  <div class="text-body-2 text-disabled">
                    فایل رزومه شما
                  </div>
                </div>
              </div>
              <VBtn
                color="primary"
                variant="outlined"
                :href="getFileUrl(profileData.resume_url)"
                target="_blank"
                download
              >
                <VIcon
                  icon="bx-download"
                  class="me-2"
                />
                دانلود
              </VBtn>
            </div>
            <div
              v-else
              class="text-center py-8 text-medium-emphasis"
            >
              <VIcon
                icon="bx-file-blank"
                size="48"
                class="mb-2"
              />
              <p>رزومه‌ای آپلود نشده است</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- محتوای پروفایل - حالت ویرایش -->
    <VRow
      v-else-if="profileData && isEditing"
    >
      <VCol cols="12">
        <VCard>
          <VCardItem>
            <VCardTitle>ویرایش پروفایل</VCardTitle>
            <VCardSubtitle>
              اطلاعات خود را ویرایش کرده و ذخیره کنید
            </VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VForm @submit.prevent="saveProfile">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.first_name"
                    label="نام"
                    placeholder="علی"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.last_name"
                    label="نام خانوادگی"
                    placeholder="رضایی"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="form.address"
                    label="آدرس"
                    placeholder="تهران، ایران"
                    rows="3"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VLabel class="mb-1 text-body-2 text-wrap">
                    تاریخ تولد
                  </VLabel>
                  <div class="d-flex gap-2">
                    <AppTextField
                      v-model="form.birthday_day"
                      placeholder="روز"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      max="31"
                      style="flex: 0 0 80px;"
                    />
                    <AppSelect
                      v-model="form.birthday_month"
                      :items="persianMonths"
                      item-title="title"
                      item-value="value"
                      placeholder="ماه"
                      style="flex: 1;"
                    />
                    <AppTextField
                      v-model="form.birthday_year"
                      placeholder="سال"
                      type="text"
                      inputmode="numeric"
                      maxlength="4"
                      style="flex: 0 0 100px;"
                    />
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.gender"
                    :items="genderOptions"
                    item-title="title"
                    item-value="value"
                    label="جنسیت"
                    placeholder="انتخاب کنید"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.military"
                    :items="militaryOptions"
                    item-title="title"
                    item-value="value"
                    label="وضعیت نظام وظیفه"
                    placeholder="انتخاب کنید"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.degree"
                    :items="degreeOptions"
                    item-title="title"
                    item-value="value"
                    label="آخرین مدرک تحصیلی"
                    placeholder="انتخاب کنید"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.phone"
                    label="شماره تماس"
                    placeholder="09123456789"
                    type="tel"
                    inputmode="numeric"
                    maxlength="11"
                    @input="handlePhoneInput('phone')"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.profession"
                    label="حوزه فعالیت"
                    placeholder="برنامه‌نویس نرم‌افزار"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.education_status"
                    :items="educationStatusOptions"
                    item-title="title"
                    item-value="value"
                    label="وضعیت تحصیل"
                    placeholder="انتخاب کنید"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.marital_status"
                    :items="maritalStatusOptions"
                    item-title="title"
                    item-value="value"
                    label="وضعیت تأهل"
                    placeholder="انتخاب کنید"
                    clearable
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.languages"
                    label="زبان‌ها"
                    placeholder="فارسی، انگلیسی"
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextField
                    v-model="form.emergency_contact_info"
                    label="اطلاعات تماس اضطراری"
                    placeholder="پدر - رضا رضایی"
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextField
                    v-model="form.emergency_contact_number"
                    label="شماره تماس اضطراری"
                    placeholder="09119876543"
                    type="tel"
                    inputmode="numeric"
                    maxlength="11"
                    @input="handlePhoneInput('emergency_contact_number')"
                  />
                </VCol>

                <VCol cols="12">
                  <AppFileInput
                    :model-value="form.resume"
                    label="رزومه"
                    accept=".pdf,.doc,.docx"
                    hint="فایل PDF یا Word (حداکثر 2 مگابایت)"
                    show-size
                    :rules="[
                      (files: FileList | File[] | null) => {
                        if (!files || files.length === 0) return true
                        const file = files[0]
                        const maxSize = 2 * 1024 * 1024 // 2MB
                        if (file.size > maxSize) {
                          return 'حجم فایل باید کمتر از 2 مگابایت باشد'
                        }
                        return true
                      }
                    ]"
                    @update:model-value="(value) => {
                      let file: File | null = null
                      if (value instanceof File) {
                        file = value
                      } else if (value instanceof FileList && value.length > 0) {
                        file = value[0]
                      } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
                        file = value[0]
                      }
                      form.resume = file
                    }"
                  />
                  <div
                    v-if="existingResumeUrl && !form.resume"
                    class="mt-2"
                  >
                    <VAlert
                      type="info"
                      variant="tonal"
                      density="compact"
                    >
                      <div class="d-flex align-center justify-space-between">
                        <span>رزومه قبلی شما:</span>
                        <VBtn
                          color="primary"
                          size="small"
                          variant="text"
                          :href="existingResumeUrl"
                          target="_blank"
                          download
                        >
                          <VIcon
                            icon="bx-download"
                            size="16"
                            class="me-1"
                          />
                          مشاهده رزومه قبلی
                        </VBtn>
                      </div>
                    </VAlert>
                  </div>
                </VCol>

                <VCol cols="12">
                  <AppFileInput
                    :model-value="form.profile_photo"
                    label="عکس پروفایل"
                    accept="image/*"
                    hint="فایل تصویری JPG, PNG یا JPEG (حداکثر 2 مگابایت)"
                    show-size
                    :rules="[
                      (files: FileList | File[] | null) => {
                        if (!files || files.length === 0) return true
                        const file = files[0]
                        const maxSize = 2 * 1024 * 1024 // 2MB
                        if (file.size > maxSize) {
                          return 'حجم فایل باید کمتر از 2 مگابایت باشد'
                        }
                        return true
                      }
                    ]"
                    @update:model-value="handleProfilePhotoChange"
                  />
                  <div
                    v-if="profilePhotoPreview"
                    class="mt-4"
                  >
                    <p class="text-sm text-disabled mb-2">
                      پیش‌نمایش تصویر جدید:
                    </p>
                    <VImg
                      :src="profilePhotoPreview"
                      max-width="200"
                      max-height="200"
                      class="rounded"
                      cover
                    />
                  </div>
                  <div
                    v-else-if="existingProfilePhotoUrl"
                    class="mt-4"
                  >
                    <VAlert
                      type="info"
                      variant="tonal"
                      density="compact"
                      class="mb-2"
                    >
                      <p class="text-xs mb-0">
                        تصویر پروفایل قبلی شما. اگر می‌خواهید تغییر دهید، فایل جدید آپلود کنید.
                      </p>
                    </VAlert>
                    <VImg
                      :src="existingProfilePhotoUrl"
                      max-width="200"
                      max-height="200"
                      class="rounded"
                      cover
                    />
                  </div>
                </VCol>

                <VCol cols="12">
                  <div class="d-flex gap-4">
                    <VBtn
                      type="submit"
                      color="primary"
                      :loading="isSubmitting"
                      :disabled="isSubmitting"
                    >
                      ذخیره تغییرات
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      color="secondary"
                      :disabled="isSubmitting"
                      @click="cancelEdit"
                    >
                      لغو
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- حالت خالی -->
    <VCard
      v-else-if="!isLoading"
      class="text-center py-12"
    >
      <VCardText>
        <VIcon
          icon="bx-user"
          size="64"
          class="text-medium-emphasis mb-4"
        />
        <p class="text-h6 mb-2">
          اطلاعاتی یافت نشد
        </p>
        <p class="text-body-2 text-medium-emphasis">
          لطفاً پروفایل خود را تکمیل کنید
        </p>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>

