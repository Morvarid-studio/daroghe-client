<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'
import moment from 'jalali-moment'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

const router = useRouter()

// فرم داده‌ها
const form = ref({
  work_date: '',
  work_hours: 1.0,
  description: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// لیست ساعات کاری
const worklogs = ref<any[]>([])
const isLoadingWorklogs = ref(false)
const deletingWorklogId = ref<number | null>(null)

// دیالوگ تایید حذف
const deleteDialogVisible = ref(false)
const worklogToDelete = ref<{ id: number; date: string } | null>(null)

// محاسبه تاریخ امروز به صورت پیش‌فرض
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// تبدیل تاریخ میلادی به شمسی
const formatToJalali = (dateString: string) => {
  if (!dateString) return ''
  try {
    // استفاده از jalali-moment برای تبدیل تاریخ میلادی به شمسی
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

// فرمت ساعت کاری
const formatWorkHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  
  if (m === 0) {
    return `${h} ساعت`
  }
  if (h === 0) {
    return `${m} دقیقه`
  }
  return `${h} ساعت و ${m} دقیقه`
}

// دریافت لیست ساعات کاری
const fetchWorklogs = async () => {
  isLoadingWorklogs.value = true
  try {
    const response = await api.get('/api/worklogs')
    worklogs.value = response.data || []
  }
  catch (error: any) {
    console.error('Failed to fetch worklogs', error)
    worklogs.value = []
  }
  finally {
    isLoadingWorklogs.value = false
  }
}

// باز کردن دیالوگ تایید حذف
const openDeleteDialog = (worklog: any) => {
  worklogToDelete.value = {
    id: worklog.id,
    date: formatToJalali(worklog.work_date),
  }
  deleteDialogVisible.value = true
}

// بستن دیالوگ
const closeDeleteDialog = () => {
  deleteDialogVisible.value = false
  worklogToDelete.value = null
}

// حذف (آرشیو) ساعات کاری
const archiveWorklog = async () => {
  if (!worklogToDelete.value) return

  const worklogId = worklogToDelete.value.id
  deletingWorklogId.value = worklogId

  try {
    const response = await api.patch('/api/worklogs/archive', { id: worklogId })
    console.log('Worklog archived successfully:', response.data)
    
    // بستن دیالوگ
    closeDeleteDialog()
    
    // رفرش لیست
    await fetchWorklogs()
    
    // نمایش پیام موفقیت
    successMessage.value = response.data?.message || 'رکورد با موفقیت حذف شد'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  catch (error: any) {
    console.error('Failed to archive worklog', error)
    const errorMsg = error.response?.data?.message || 'خطا در حذف رکورد. لطفاً دوباره تلاش کنید.'
    errorMessage.value = errorMsg
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
  finally {
    deletingWorklogId.value = null
  }
}

// تنظیم تاریخ پیش‌فرض به امروز و دریافت لیست
onMounted(() => {
  form.value.work_date = getTodayDate()
  fetchWorklogs()
})

// تنظیمات date picker
const datePickerConfig = computed(() => ({
  altInput: true,
  altFormat: 'Y/m/d',
  dateFormat: 'Y-m-d',
  defaultDate: getTodayDate(),
}))

// نمایش ساعت به صورت فرمت شده
const formattedHours = computed(() => {
  const hours = Math.floor(form.value.work_hours)
  const minutes = Math.round((form.value.work_hours - hours) * 60)
  
  if (minutes === 0) {
    return `${hours} ساعت`
  }
  if (hours === 0) {
    return `${minutes} دقیقه`
  }
  return `${hours} ساعت و ${minutes} دقیقه`
})

// اعتبارسنجی فرم
const validateForm = () => {
  if (!form.value.work_date) {
    errorMessage.value = 'لطفاً تاریخ را انتخاب کنید'
    return false
  }
  if (form.value.work_hours < 0.25) {
    errorMessage.value = 'ساعات کاری باید حداقل 15 دقیقه باشد'
    return false
  }
  if (form.value.work_hours > 8) {
    errorMessage.value = 'ساعات کاری نمی‌تواند بیشتر از 8 ساعت باشد'
    return false
  }
  return true
}

// ارسال فرم
const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // آماده‌سازی داده‌ها برای ارسال
    const workDate = form.value.work_date.trim()
    const workHours = parseFloat(form.value.work_hours.toFixed(2))
    const description = form.value.description.trim() || null

    // ساخت payload مطابق با فرمت سرور
    const payload = {
      worklogs: [
        {
          work_date: workDate,
          work_hours: workHours,
          description: description,
        },
      ],
    }

    // لاگ برای دیباگ
    console.log('Sending worklog data:', payload)

    // ارسال درخواست به API
    const response = await api.post('/api/worklogs', payload)
    
    // لاگ پاسخ سرور
    console.log('Worklog created successfully:', response.data)
    
    // نمایش پیام موفقیت
    successMessage.value = response.data?.message || 'ساعات کاری با موفقیت ثبت شد'
    
    // رفرش لیست و ریست فرم
    await fetchWorklogs()
    form.value.description = ''
    form.value.work_hours = 1.0
    form.value.work_date = getTodayDate()
    
    // پاک کردن پیام موفقیت بعد از 3 ثانیه
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  catch (error: any) {
    console.error('Failed to submit work hours', error)
    
    // مدیریت خطاهای مختلف
    if (error.response) {
      // خطای از سمت سرور
      const serverMessage = error.response?.data?.message
      const invalidDate = error.response?.data?.invalid_date
      
      if (invalidDate) {
        errorMessage.value = `تاریخ ${invalidDate} معتبر نیست. ${serverMessage || ''}`
      } else {
        errorMessage.value = serverMessage || 'خطا در ثبت ساعات کاری. لطفاً دوباره تلاش کنید.'
      }
    } else if (error.request) {
      // درخواست ارسال شد اما پاسخی دریافت نشد
      errorMessage.value = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.'
    } else {
      // خطای دیگر
      errorMessage.value = 'خطا در ثبت ساعات کاری. لطفاً دوباره تلاش کنید.'
    }
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
      md="8"
      lg="6"
    >
      <VCard>
        <VCardItem>
          <VCardTitle class="text-h5">
            ثبت ساعات کاری
          </VCardTitle>
          <VCardSubtitle>
            اطلاعات ساعات کاری خود را وارد کنید
          </VCardSubtitle>
        </VCardItem>

        <VCardText>
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

          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            {{ successMessage }}
          </VAlert>

          <VForm @submit.prevent="submit">
            <VRow>
              <!-- فیلد انتخاب تاریخ -->
              <VCol cols="12">
                <AppDateTimePicker
                  v-model="form.work_date"
                  calendar="jalali"
                  label="تاریخ"
                  placeholder="تاریخ را انتخاب کنید"
                  :config="datePickerConfig"
                  required
                />
              </VCol>

              <!-- فیلد ساعات کاری -->
              <VCol cols="12">
                <VLabel class="mb-1 text-body-2">
                  ساعات کاری
                </VLabel>
                
                <div class="mb-4">
                  <VSlider
                    v-model="form.work_hours"
                    :min="0.25"
                    :max="8"
                    :step="0.25"
                    class="w-100"
                    color="primary"
                    track-color="rgba(var(--v-theme-on-surface), 0.12)"
                  >
                    <template #prepend>
                      <span class="text-body-2 text-medium-emphasis">15 دقیقه</span>
                    </template>
                    <template #append>
                      <span class="text-body-2 text-medium-emphasis">8 ساعت</span>
                    </template>
                  </VSlider>
                </div>

                <div class="d-flex align-center gap-4 mb-2">
                  <AppTextField
                    v-model.number="form.work_hours"
                    type="number"
                    variant="outlined"
                    density="compact"
                    :min="0.25"
                    :max="8"
                    :step="0.25"
                    style="max-width: 120px;"
                    suffix="ساعت"
                    hide-details
                  />

                  <div class="text-body-2 text-medium-emphasis">
                    <VIcon
                      size="16"
                      icon="bx-time"
                      class="me-1"
                    />
                    {{ formattedHours }}
                  </div>
                </div>
              </VCol>

              <!-- فیلد توضیحات -->
              <VCol cols="12">
                <AppTextarea
                  v-model="form.description"
                  label="توضیحات (اختیاری)"
                  placeholder="توضیحات مربوط به ساعات کاری..."
                  rows="4"
                />
              </VCol>

              <!-- دکمه ثبت -->
              <VCol cols="12">
                <div class="d-flex gap-3 justify-end">
                  <VBtn
                    variant="outlined"
                    color="secondary"
                    @click="router.push('/work-hours/chart')"
                  >
                    انصراف
                  </VBtn>
                  <VBtn
                    type="submit"
                    color="primary"
                    :loading="isSubmitting"
                    :disabled="isSubmitting"
                  >
                    ثبت ساعات کاری
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>

      <!-- جدول لیست ساعات کاری -->
      <VCard class="mt-6">
        <VCardItem>
          <VCardTitle class="text-h5">
            لیست ساعات کاری
          </VCardTitle>
          <VCardSubtitle>
            تاریخچه ثبت ساعات کاری شما
          </VCardSubtitle>
        </VCardItem>

        <VCardText>
          <VDataTable
            :headers="[
              { title: 'روز', key: 'work_date', sortable: true },
              { title: 'ساعت کاری', key: 'work_hours', sortable: true },
              { title: 'توضیحات', key: 'description', sortable: false },
              { title: 'عملیات', key: 'actions', sortable: false, align: 'center' },
            ]"
            :items="worklogs"
            :loading="isLoadingWorklogs"
            :items-per-page="10"
            class="text-no-wrap"
          >
            <!-- ستون تاریخ -->
            <template #item.work_date="{ item }">
              <span class="font-weight-medium">
                {{ formatToJalali(item.work_date) }}
              </span>
            </template>

            <!-- ستون ساعت کاری -->
            <template #item.work_hours="{ item }">
              <span class="text-body-1">
                {{ formatWorkHours(item.work_hours) }}
              </span>
            </template>

            <!-- ستون توضیحات -->
            <template #item.description="{ item }">
              <span class="text-body-2 text-medium-emphasis">
                {{ item.description || '-' }}
              </span>
            </template>

            <!-- ستون عملیات (دکمه حذف) -->
            <template #item.actions="{ item }">
              <VBtn
                icon
                variant="text"
                color="error"
                size="small"
                :loading="deletingWorklogId === item.id"
                :disabled="deletingWorklogId !== null || deleteDialogVisible"
                @click="openDeleteDialog(item)"
              >
                <VIcon icon="bx-trash" />
                <VTooltip activator="parent">
                  حذف
                </VTooltip>
              </VBtn>
            </template>

            <!-- پیام لودینگ -->
            <template #loading>
              <div class="text-center py-8">
                <VProgressCircular
                  indeterminate
                  color="primary"
                  class="mb-4"
                />
                <p class="text-body-1 text-medium-emphasis">
                  در حال بارگذاری... لطفاً صبر کنید
                </p>
              </div>
            </template>

            <!-- پیام خالی -->
            <template #no-data>
              <div class="text-center py-8">
                <VIcon
                  size="48"
                  icon="bx-inbox"
                  class="text-medium-emphasis mb-2"
                />
                <p class="text-body-1 text-medium-emphasis">
                  هیچ رکوردی ثبت نشده است
                </p>
              </div>
            </template>
          </VDataTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- دیالوگ تایید حذف -->
  <VDialog
    v-model="deleteDialogVisible"
    max-width="500"
    persistent
  >
    <VCard>
      <VCardItem class="text-center">
        <VCardTitle class="text-h5">
          تایید حذف
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <div class="text-center mb-4">
          <VAvatar
            color="error"
            variant="tonal"
            size="64"
            class="mb-4"
          >
            <VIcon
              icon="bx-trash"
              size="32"
            />
          </VAvatar>
          <p class="text-body-1 mb-2">
            آیا از حذف این رکورد اطمینان دارید؟
          </p>
          <p
            v-if="worklogToDelete"
            class="text-body-2 text-medium-emphasis"
          >
            تاریخ: <strong>{{ worklogToDelete.date }}</strong>
          </p>
          <p class="text-body-2 text-error mt-2">
            این عمل قابل بازگشت نیست.
          </p>
        </div>
      </VCardText>

      <VCardActions class="flex-column gap-2 pa-4">
        <VBtn
          color="error"
          variant="elevated"
          block
          :loading="deletingWorklogId !== null"
          :disabled="deletingWorklogId !== null"
          @click="archiveWorklog"
        >
          حذف
        </VBtn>
        <VBtn
          variant="outlined"
          color="secondary"
          block
          :disabled="deletingWorklogId !== null"
          @click="closeDeleteDialog"
        >
          انصراف
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
:deep(.v-slider) {
  margin-inline: 0.5rem;
}
</style>

