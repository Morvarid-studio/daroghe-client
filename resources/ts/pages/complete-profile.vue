<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'

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
  resume: '',
  profile_photo: '',
}

const cloneDefaultForm = () => JSON.parse(JSON.stringify(defaultForm))

const form = ref(cloneDefaultForm())
const isSubmitting = ref(false)
const savedMessage = ref('')
const errorMessage = ref('')

const genderOptions = [
  { title: 'مرد', value: 'Male' },
  { title: 'زن', value: 'Female' },
]

const militaryOptions = [
  { title: 'مشمول', value: 'Conscription Pending' },
  { title: 'معاف', value: 'Exempted' },
  { title: 'پایان خدمت', value: 'Completed' },
  { title: 'خانم هستم', value: 'Female' },
]

const degreeOptions = [
  { title: 'دیپلم', value: 'Diploma' },
  { title: 'کاردانی', value: 'Associate Degree' },
  { title: 'کارشناسی', value: 'Bachelor of Computer Engineering' },
  { title: 'کارشناسی ارشد', value: 'Master of Computer Engineering' },
  { title: 'دکتری', value: 'PhD of Computer Engineering' },
]

const educationStatusOptions = [
  { title: 'در حال تحصیل', value: 'Studying' },
  { title: 'فارغ‌التحصیل', value: 'Graduated' },
]

const maritalStatusOptions = [
  { title: 'مجرد', value: 'Single' },
  { title: 'متأهل', value: 'Married' },
]

const sanitizeDigits = (value: string) => value.replace(/\D/g, '')

const handlePhoneInput = (field: 'phone' | 'emergency_contact_number') => {
  form.value[field] = sanitizeDigits(form.value[field]).slice(0, 15)
}

const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' && redirect ? redirect : '/dashboard'
})

const persistForm = () => {
  if (typeof window === 'undefined')
    return

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(form.value))
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

const markProfileCompleted = () => {
  const userCookie = useCookie('userData')

  if (userCookie.value)
    userCookie.value = { ...userCookie.value, profile_completed: true }
}

const buildPayload = () => {
  const entries = Object.entries(form.value).map(([key, value]) => {
    if (typeof value === 'string') {
      const trimmedValue = value.trim()

      return [key, trimmedValue.length ? trimmedValue : null]
    }

    return [key, value ?? null]
  })

  return Object.fromEntries(entries)
}

const submit = async () => {
  isSubmitting.value = true
  savedMessage.value = ''
  errorMessage.value = ''

  try {
    const payload = buildPayload()

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
                  maxlength="15"
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
                  maxlength="15"
                  @input="handlePhoneInput('emergency_contact_number')"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="form.resume"
                  label="رزومه (لینک یا خلاصه)"
                  hint="در صورت نیاز می‌توانید لینک رزومه را وارد کنید."
                  rows="3"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="form.profile_photo"
                  label="عکس پروفایل (لینک یا توضیح)"
                  rows="2"
                />
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

