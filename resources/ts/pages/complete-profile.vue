<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import moment from 'jalali-moment'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
    allowIncompleteProfile: true,
  },
})

const router = useRouter()
const route = useRoute()

const LOCAL_STORAGE_KEY = 'completeProfileDraft'

const defaultForm = {
  first_name: '',
  last_name: '',
  address: '',
  birthday: '',
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

const cloneDefaultForm = () => JSON.parse(JSON.stringify(defaultForm))

const form = ref(cloneDefaultForm())
const isSubmitting = ref(false)
const savedMessage = ref('')
const errorMessage = ref('')
const profilePhotoPreview = ref<string | null>(null)

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

const sanitizeDigits = (value: string) => value.replace(/\D/g, '')

const handlePhoneInput = (field: 'phone' | 'emergency_contact_number') => {
  if (field === 'phone') {
    // برای phone فقط 11 رقم (09xxxxxxxxx)
    form.value[field] = sanitizeDigits(form.value[field]).slice(0, 11)
  } else {
    // برای emergency_contact_number هم 11 رقم
    form.value[field] = sanitizeDigits(form.value[field]).slice(0, 11)
  }
}

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' && redirect ? redirect : '/dashboard'
})

const persistForm = () => {
  if (typeof window === 'undefined')
    return

  // فایل‌ها رو در localStorage ذخیره نمی‌کنیم
  const formDataToSave = { ...form.value }
  formDataToSave.resume = null
  formDataToSave.profile_photo = null

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formDataToSave))
}

const loadDraft = () => {
  if (typeof window === 'undefined')
    return

  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      form.value = { ...cloneDefaultForm(), ...parsed }
    }
    catch (error) {
      console.warn('Failed to parse stored profile draft', error)
      form.value = cloneDefaultForm()
    }
  }
}

onMounted(() => {
  loadDraft()
  handlePhoneInput('phone')
  handlePhoneInput('emergency_contact_number')
})

watch(form, persistForm, { deep: true })

// Watch برای preview عکس پروفایل
watch(() => form.value.profile_photo, (newFile) => {
  // Cleanup URL قبلی
  if (profilePhotoPreview.value) {
    URL.revokeObjectURL(profilePhotoPreview.value)
    profilePhotoPreview.value = null
  }

  // ایجاد URL جدید برای preview
  if (newFile instanceof File) {
    profilePhotoPreview.value = URL.createObjectURL(newFile)
  }
}, { immediate: true })

// Cleanup در unmount
onUnmounted(() => {
  if (profilePhotoPreview.value) {
    URL.revokeObjectURL(profilePhotoPreview.value)
  }
})

const markProfileCompleted = () => {
  const userCookie = useCookie('userData')

  if (userCookie.value)
    userCookie.value = { ...userCookie.value, profile_completed: true }
}

// تبدیل تاریخ میلادی به شمسی
const miladiToShamsi = (miladiDate: string): string => {
  if (!miladiDate) return ''
  try {
    // تبدیل تاریخ میلادی (Y-m-d) به شمسی (Y/m/d)
    const momentDate = moment(miladiDate, 'YYYY-MM-DD')
    if (momentDate.isValid()) {
      return momentDate.format('jYYYY/jMM/jDD')
    }
    return miladiDate
  }
  catch (error) {
    console.error('Error converting date to jalali:', error)
    return miladiDate
  }
}

const buildPayload = () => {
  const formData = new FormData()

  // اضافه کردن فیلدهای متنی
  Object.entries(form.value).forEach(([key, value]) => {
    if (key === 'resume' || key === 'profile_photo') {
      // فایل‌ها رو بعداً اضافه می‌کنیم
      return
    }

    // تبدیل birthday از میلادی به شمسی قبل از ارسال
    if (key === 'birthday' && typeof value === 'string' && value.trim()) {
      const shamsiDate = miladiToShamsi(value.trim())
      if (shamsiDate) {
        formData.append(key, shamsiDate)
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

  // اضافه کردن فایل‌ها
  if (form.value.resume instanceof File) {
    formData.append('resume', form.value.resume)
  }

  if (form.value.profile_photo instanceof File) {
    formData.append('profile_photo', form.value.profile_photo)
  }

  return formData
}

const submit = async () => {
  isSubmitting.value = true
  savedMessage.value = ''
  errorMessage.value = ''

  try {
    const payload = buildPayload()

    // برای FormData باید Content-Type رو خود axios set کنه
    await api.post('/api/updateinformation', payload)

    markProfileCompleted()
    if (typeof window !== 'undefined')
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    savedMessage.value = 'پروفایل شما با موفقیت ذخیره شد.'

    setTimeout(() => {
      router.push(redirectTarget.value)
    }, 600)
  }
  catch (error: any) {
    console.error('Failed to submit profile', error)
    errorMessage.value = error.response?.data?.message || 'خطا در ذخیره اطلاعات. دوباره تلاش کنید.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <VRow class="justify-center">
    <VCol
      cols="12"
      md="10"
      lg="8"
    >
      <VAlert
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        برای ادامه‌ی استفاده از سامانه ابتدا پروفایل خود را تکمیل کنید. اطلاعات شما فقط در دستگاه ذخیره می‌شود تا بعداً برای ثبت نهایی استفاده شود.
      </VAlert>

      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </VAlert>

      <VCard>
        <VCardItem>
          <VCardTitle class="text-h5">
            تکمیل پروفایل
          </VCardTitle>
          <VCardSubtitle>
            لطفاً تمام فیلدها را با دقت پر کنید. اطلاعات در این دستگاه ذخیره می‌شود تا از بین نرود.
          </VCardSubtitle>
        </VCardItem>

        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.first_name"
                  label="نام"
                  placeholder="علی"
                  required
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.last_name"
                  label="نام خانوادگی"
                  placeholder="رضایی"
                  required
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

              <VCol cols="12" md="6">
                <AppDateTimePicker
                  v-model="form.birthday"
                  calendar="jalali"
                  label="تاریخ تولد"
                  placeholder="تاریخ را انتخاب کنید"
                  :config="{
                    altInput: true,
                    altFormat: 'Y/m/d',
                    dateFormat: 'Y-m-d',
                  }"
                />
              </VCol>

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.profession"
                  label="حوزه فعالیت"
                  placeholder="برنامه‌نویس نرم‌افزار"
                />
              </VCol>

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
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

              <VCol cols="12" md="6">
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
                  v-model="form.resume"
                  label="رزومه"
                  accept=".pdf,.doc,.docx"
                  hint="فایل PDF یا Word (حداکثر 2MB)"
                  show-size
                />
              </VCol>

              <VCol cols="12">
                <AppFileInput
                  v-model="form.profile_photo"
                  label="عکس پروفایل"
                  accept="image/*"
                  hint="فایل تصویری JPG, PNG یا JPEG (حداکثر 2MB)"
                  show-size
                />
                <div
                  v-if="profilePhotoPreview"
                  class="mt-4"
                >
                  <VImg
                    :src="profilePhotoPreview"
                    max-width="200"
                    max-height="200"
                    class="rounded"
                    cover
                  />
                </div>
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  color="primary"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  ذخیره و ادامه
                </VBtn>
              </VCol>

              <VCol
                v-if="savedMessage"
                cols="12"
              >
                <VAlert
                  type="success"
                  variant="tonal"
                >
                  {{ savedMessage }}
                </VAlert>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

