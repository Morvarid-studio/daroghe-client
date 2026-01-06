<script setup lang="ts">
import api from '@/lib/axios'

interface Tag {
  id: number
  name: string
  color?: string
}

interface AccountFormData {
  account_type?: 'employee' | 'company' | 'external' | 'petty_cash'
  display_name?: string
  owner_name?: string
  name?: string
  user_id?: number | null
  bank_name: string
  account_number: string
  sheba: string
  description?: string
  tags?: number[]
  roles?: string[]
}

interface Role {
  id: number
  name: string
  display_name: string
}

interface User {
  id: number
  user_name: string
}

interface Props {
  isDialogVisible: boolean
  mode?: 'admin' | 'user' // admin: تمام فیلدها، user: فقط فیلدهای حساب بانکی
  tags?: Tag[]
  roles?: Role[]
  users?: User[]
  defaultAccountType?: 'employee' | 'company' | 'external' | 'petty_cash'
}

interface Emit {
  (e: 'update:isDialogVisible', value: boolean): void
  (e: 'submit', value: AccountFormData): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'user',
  tags: () => [],
  roles: () => [],
  users: () => [],
  defaultAccountType: 'external',
})

const emit = defineEmits<Emit>()

// فرم حساب
const accountForm = ref<AccountFormData>({
  account_type: props.defaultAccountType,
  display_name: '',
  owner_name: '',
  name: '',
  user_id: null,
  bank_name: '',
  account_number: '',
  sheba: '',
  description: '',
  tags: [],
  roles: [],
})

// لیست بانک‌های ایرانی
const iranianBanks = [
  { title: 'بانک ملی ایران', value: 'بانک ملی ایران' },
  { title: 'بانک سپه', value: 'بانک سپه' },
  { title: 'بانک مسکن', value: 'بانک مسکن' },
  { title: 'بانک کشاورزی', value: 'بانک کشاورزی' },
  { title: 'بانک صنعت و معدن', value: 'بانک صنعت و معدن' },
  { title: 'بانک توسعه صادرات ایران', value: 'بانک توسعه صادرات ایران' },
  { title: 'بانک توسعه تعاون', value: 'بانک توسعه تعاون' },
  { title: 'بانک اقتصاد نوین', value: 'بانک اقتصاد نوین' },
  { title: 'بانک پارسیان', value: 'بانک پارسیان' },
  { title: 'بانک پاسارگاد', value: 'بانک پاسارگاد' },
  { title: 'بانک کارآفرین', value: 'بانک کارآفرین' },
  { title: 'بانک سامان', value: 'بانک سامان' },
  { title: 'بانک سینا', value: 'بانک سینا' },
  { title: 'بانک خاورمیانه', value: 'بانک خاورمیانه' },
  { title: 'بانک شهر', value: 'بانک شهر' },
  { title: 'بانک دی', value: 'بانک دی' },
  { title: 'بانک صادرات ایران', value: 'بانک صادرات ایران' },
  { title: 'بانک ملت', value: 'بانک ملت' },
  { title: 'بانک تجارت', value: 'بانک تجارت' },
  { title: 'بانک رفاه کارگران', value: 'بانک رفاه کارگران' },
  { title: 'بانک قرض‌الحسنه مهر ایران', value: 'بانک قرض‌الحسنه مهر ایران' },
  { title: 'بانک قرض‌الحسنه رسالت', value: 'بانک قرض‌الحسنه رسالت' },
  { title: 'پست بانک ایران', value: 'پست بانک ایران' },
]

const errorMessage = ref('')
const isSubmitting = ref(false)

// اعتبارسنجی شماره حساب
const validateAccountNumber = (event: Event) => {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  accountForm.value.account_number = digits
}

// اعتبارسنجی شماره شبا (24 رقم + IR)
const validateSheba = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.toUpperCase().replace(/\s/g, '')
  
  // اگر با IR شروع نشده، اضافه می‌کنیم
  if (!value.startsWith('IR')) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 24) {
      accountForm.value.sheba = digits.length > 0 ? 'IR' + digits : ''
    } else {
      target.value = accountForm.value.sheba
    }
  } else {
    // اگر با IR شروع شده
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 26) { // IR (2 chars) + 24 digits
      accountForm.value.sheba = value.length <= 26 ? value : accountForm.value.sheba
    } else {
      target.value = accountForm.value.sheba
    }
  }
}

// ریست کردن فرم
const resetForm = () => {
  accountForm.value = {
    account_type: 'external',
    display_name: '',
    owner_name: '',
    name: '',
    user_id: null,
    bank_name: '',
    account_number: '',
    sheba: '',
    description: '',
    tags: [],
    roles: [],
  }
  errorMessage.value = ''
  isSubmitting.value = false
}

// بستن دیالوگ
const closeDialog = () => {
  emit('update:isDialogVisible', false)
  resetForm()
}

// ثبت فرم
const submitForm = async () => {
  errorMessage.value = ''
  
  // اعتبارسنجی
  if (!accountForm.value.bank_name.trim()) {
    errorMessage.value = 'لطفاً نام بانک را انتخاب کنید'
    return
  }
  if (!accountForm.value.account_number.trim()) {
    errorMessage.value = 'لطفاً شماره حساب را وارد کنید'
    return
  }
  if (!accountForm.value.sheba.trim()) {
    errorMessage.value = 'لطفاً شماره شبا را وارد کنید'
    return
  }
  if (accountForm.value.sheba.length !== 26) {
    errorMessage.value = 'شماره شبا باید 24 رقم + IR باشد'
    return
  }
  
  if (props.mode === 'admin') {
    if (!accountForm.value.display_name?.trim()) {
      errorMessage.value = 'لطفاً نام نمایشی را وارد کنید'
      return
    }
    // اگر account_type = employee یا petty_cash باشد، user_id الزامی است
    if ((accountForm.value.account_type === 'employee' || accountForm.value.account_type === 'petty_cash') && !accountForm.value.user_id) {
      errorMessage.value = 'لطفاً کاربر را انتخاب کنید'
      return
    }
  }

  isSubmitting.value = true
  emit('submit', { ...accountForm.value })
  // Note: isSubmitting در watch یا closeDialog reset می‌شود
  // اگر خطا رخ دهد، parent component خطا را handle می‌کند و دیالوگ باز می‌ماند
  // در این صورت باید isSubmitting را reset کنیم
  setTimeout(() => {
    if (props.isDialogVisible && isSubmitting.value) {
      // اگر بعد از 3 ثانیه دیالوگ هنوز باز است و isSubmitting هنوز true است، reset می‌کنیم
      isSubmitting.value = false
    }
  }, 3000)
}

// Watch برای reset کردن فرم وقتی دیالوگ بسته می‌شود
watch(() => props.isDialogVisible, (newVal) => {
  if (!newVal) {
    resetForm()
  } else {
    // وقتی دیالوگ باز می‌شود، account_type را از defaultAccountType تنظیم می‌کنیم
    accountForm.value.account_type = props.defaultAccountType
  }
})

// Watch برای defaultAccountType
watch(() => props.defaultAccountType, (newVal) => {
  if (props.isDialogVisible && newVal) {
    accountForm.value.account_type = newVal
  }
})
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    max-width="600"
    @update:model-value="emit('update:isDialogVisible', $event)"
  >
    <VCard>
      <VCardTitle>
        {{ mode === 'admin' ? 'ایجاد حساب جدید' : 'افزودن حساب بانکی جدید' }}
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

        <VForm @submit.prevent="submitForm">
          <VRow>
            <!-- نوع حساب (فقط برای admin) -->
            <VCol
              v-if="mode === 'admin'"
              cols="12"
            >
              <AppSelect
                v-model="accountForm.account_type"
                :items="[
                  { title: 'کارمند', value: 'employee' },
                  { title: 'شرکت', value: 'company' },
                  { title: 'خارجی', value: 'external' },
                  { title: 'تنخواه', value: 'petty_cash' }
                ]"
                label="نوع حساب"
                required
              />
            </VCol>

            <!-- انتخاب کاربر (فقط برای employee و petty_cash) -->
            <VCol
              v-if="mode === 'admin' && (accountForm.account_type === 'employee' || accountForm.account_type === 'petty_cash') && users.length > 0"
              cols="12"
            >
              <AppSelect
                v-model="accountForm.user_id"
                :items="users"
                item-title="user_name"
                item-value="id"
                label="کاربر"
                required
              />
            </VCol>

            <!-- نام نمایشی (فقط برای admin) -->
            <VCol
              v-if="mode === 'admin'"
              cols="12"
            >
              <AppTextField
                v-model="accountForm.display_name"
                label="نام نمایشی"
                required
              />
            </VCol>

            <!-- نام صاحب حساب (فقط برای admin) -->
            <VCol
              v-if="mode === 'admin'"
              cols="12"
            >
              <AppTextField
                v-model="accountForm.owner_name"
                label="نام صاحب حساب"
              />
            </VCol>

            <!-- نام بانک (dropdown) -->
            <VCol cols="12">
              <AppSelect
                v-model="accountForm.bank_name"
                :items="iranianBanks"
                item-title="title"
                item-value="value"
                label="نام بانک"
                placeholder="بانک را انتخاب کنید"
                required
              />
            </VCol>

            <!-- شماره حساب -->
            <VCol cols="12">
              <AppTextField
                v-model="accountForm.account_number"
                label="شماره حساب"
                placeholder="شماره حساب"
                required
                @input="validateAccountNumber($event)"
              />
            </VCol>

            <!-- شماره شبا -->
            <VCol cols="12">
              <AppTextField
                v-model="accountForm.sheba"
                label="شماره شبا (24 رقم + IR)"
                placeholder="IR123456789012345678901234"
                maxlength="26"
                required
                @input="validateSheba($event)"
              />
            </VCol>

            <!-- توضیحات -->
            <VCol cols="12">
              <AppTextarea
                v-model="accountForm.description"
                label="توضیحات"
                placeholder="توضیحات اختیاری"
                rows="3"
              />
            </VCol>

            <!-- تگ‌ها (فقط برای admin) -->
            <VCol
              v-if="mode === 'admin' && tags.length > 0"
              cols="12"
            >
              <AppSelect
                v-model="accountForm.tags"
                :items="tags"
                item-title="name"
                item-value="id"
                label="تگ‌ها"
                multiple
                chips
                hint="تگ‌های مربوط به این حساب را انتخاب کنید"
              />
            </VCol>

            <!-- نقش‌های دسترسی (فقط برای admin) -->
            <VCol
              v-if="mode === 'admin' && roles.length > 0"
              cols="12"
            >
              <AppSelect
                v-model="accountForm.roles"
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
          @click="closeDialog"
        >
          انصراف
        </VBtn>
        <VBtn
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="submitForm"
        >
          {{ mode === 'admin' ? 'ایجاد' : 'ثبت' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

