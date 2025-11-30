<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

// فرم اطلاعات کارت
const form = ref({
  cardholderName: '',
  accountNumber: '',
  sheba: '',
  bankName: '',
  expirationMonth: '',
  expirationYear: '',
  cvv2: '',
  saveForFuture: false,
})

// کارت‌های ذخیره شده
const savedCards = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// پاک کردن فرم
const clearForm = () => {
  form.value = {
    cardholderName: '',
    accountNumber: '',
    sheba: '',
    bankName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv2: '',
    saveForFuture: false,
  }
  errorMessage.value = ''
  successMessage.value = ''
}

// اعتبارسنجی شماره حساب
const validateAccountNumber = (event: Event) => {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  form.value.accountNumber = digits
}

// اعتبارسنجی CVV2 (3 رقم)
const validateCVV2 = (event: Event) => {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  if (digits.length <= 3) {
    form.value.cvv2 = digits
  } else {
    target.value = form.value.cvv2
  }
}

// اعتبارسنجی شماره شبا (24 رقم + IR)
const validateSheba = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.toUpperCase().replace(/\s/g, '')
  
  // اگر با IR شروع نشده، اضافه می‌کنیم
  if (!value.startsWith('IR')) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 24) {
      form.value.sheba = digits.length > 0 ? 'IR' + digits : ''
    } else {
      target.value = form.value.sheba
    }
  } else {
    // اگر با IR شروع شده
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 26) { // IR (2 chars) + 24 digits
      form.value.sheba = value.length <= 26 ? value : form.value.sheba
    } else {
      target.value = form.value.sheba
    }
  }
}

// اعتبارسنجی ماه (01-12)
const validateMonth = (event: Event) => {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  if (digits.length <= 2) {
    form.value.expirationMonth = digits
    if (digits.length === 2) {
      const month = parseInt(digits)
      if (month < 1 || month > 12) {
        form.value.expirationMonth = ''
        target.value = ''
        errorMessage.value = 'ماه باید بین 01 تا 12 باشد'
      }
    }
  } else {
    target.value = form.value.expirationMonth
  }
}

// اعتبارسنجی سال (مثلا 1405)
const validateYear = (event: Event) => {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  if (digits.length <= 4) {
    form.value.expirationYear = digits
  } else {
    target.value = form.value.expirationYear
  }
}

// ثبت کارت
const registerCard = async () => {
  // اعتبارسنجی
  if (!form.value.cardholderName.trim()) {
    errorMessage.value = 'لطفا نام کامل دارنده کارت را وارد کنید'
    return
  }
  if (!form.value.accountNumber.trim()) {
    errorMessage.value = 'لطفا شماره حساب را وارد کنید'
    return
  }
  if (!form.value.bankName.trim()) {
    errorMessage.value = 'لطفا نام بانک را وارد کنید'
    return
  }
  if (form.value.expirationMonth.length !== 2) {
    errorMessage.value = 'لطفا ماه انقضا را وارد کنید (مثلا 01)'
    return
  }
  if (form.value.expirationYear.length !== 4) {
    errorMessage.value = 'لطفا سال انقضا را وارد کنید (مثلا 1405)'
    return
  }
  if (form.value.cvv2.length !== 3) {
    errorMessage.value = 'CVV2 باید 3 رقم باشد'
    return
  }
  if (form.value.sheba.length !== 26) {
    errorMessage.value = 'شماره شبا باید 24 رقم + IR باشد'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // در اینجا می‌توانید API call کنید
    // برای حالا فقط یک پیام موفقیت نمایش می‌دهیم
    await new Promise(resolve => setTimeout(resolve, 1000)) // شبیه‌سازی API call
    
    successMessage.value = 'کارت با موفقیت ثبت شد'
    
    // اگر کارت برای آینده ذخیره شود، به لیست اضافه می‌کنیم
    if (form.value.saveForFuture) {
      savedCards.value.unshift({
        id: Date.now(),
        cardholderName: form.value.cardholderName,
        bankName: form.value.bankName,
        accountNumber: form.value.accountNumber,
        sheba: form.value.sheba,
        expirationMonth: form.value.expirationMonth,
        expirationYear: form.value.expirationYear,
      })
    }
    
    // پاک کردن فرم
    clearForm()
  } catch (error: any) {
    console.error('Failed to register card', error)
    errorMessage.value = error.response?.data?.message || 'خطا در ثبت کارت. دوباره تلاش کنید.'
  } finally {
    isSubmitting.value = false
  }
}

// بارگذاری کارت‌های ذخیره شده
const loadSavedCards = async () => {
  isLoading.value = true
  try {
    // در اینجا می‌توانید API call کنید
    // const response = await api.get('/api/bank-info')
    // savedCards.value = response.data
    
    // برای حالا خالی می‌ماند
    savedCards.value = []
  } catch (error) {
    console.error('Failed to load saved cards', error)
  } finally {
    isLoading.value = false
  }
}

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

onMounted(() => {
  loadSavedCards()
})
</script>

<template>
  <div class="bank-information-page">
    <!-- عنوان صفحه -->
    <div class="page-title">
      <h1>اطلاعات بانکی</h1>
    </div>

    <!-- پیام‌های خطا و موفقیت -->
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
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </VAlert>

    <!-- محتوای اصلی -->
    <div class="main-content">
      <!-- بخش چپ: فرم افزودن کارت -->
      <div class="form-section">
        <h2 class="section-title">افزودن کارت جدید</h2>
        
        <VForm @submit.prevent="registerCard">
          <div class="form-fields">
            <!-- نام کامل دارنده کارت -->
            <AppTextField
              v-model="form.cardholderName"
              label="نام کامل دارنده کارت"
              placeholder="نام و نام خانوادگی"
              class="mb-4"
            />

            <!-- شماره حساب -->
            <AppTextField
              v-model="form.accountNumber"
              label="شماره حساب"
              placeholder="شماره حساب"
              class="mb-4"
              @input="validateAccountNumber($event)"
            />

            <!-- شماره شبا -->
            <AppTextField
              v-model="form.sheba"
              label="شماره شبا (۲۴ + IR رقم)"
              placeholder="IR123456789012345678901234"
              class="mb-4"
              maxlength="26"
              @input="validateSheba($event)"
            />

            <!-- نام بانک -->
            <AppSelect
              v-model="form.bankName"
              :items="iranianBanks"
              item-title="title"
              item-value="value"
              label="نام بانک"
              placeholder="بانک را انتخاب کنید"
              class="mb-4"
              clearable
            />

            <!-- تاریخ انقضا -->
            <div class="expiration-row mb-4">
              <AppTextField
                v-model="form.expirationMonth"
                label="ماه (مثلا ۰۱)"
                placeholder="01"
                class="expiration-month"
                maxlength="2"
                @input="validateMonth($event)"
              />
              <AppTextField
                v-model="form.expirationYear"
                label="سال (مثلا ۱۴۰۵)"
                placeholder="1405"
                class="expiration-year"
                maxlength="4"
                @input="validateYear($event)"
              />
            </div>

            <!-- CVV2 -->
            <AppTextField
              v-model="form.cvv2"
              label="CVV2"
              placeholder="123"
              class="mb-4"
              maxlength="3"
              type="password"
              @input="validateCVV2($event)"
            />

            <!-- تoggle ذخیره کارت -->
            <div class="save-toggle mb-6">
              <VSwitch
                v-model="form.saveForFuture"
                label="ذخیره این کارت برای پرداخت‌های آینده؟"
                color="primary"
              />
            </div>

            <!-- دکمه‌ها -->
            <div class="form-buttons">
              <VBtn
                type="button"
                variant="outlined"
                color="default"
                class="clear-btn"
                @click="clearForm"
              >
                پاک کردن فرم
              </VBtn>
              <VBtn
                type="submit"
                color="primary"
                class="submit-btn"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                ثبت کارت
              </VBtn>
            </div>
          </div>
        </VForm>
      </div>

      <!-- بخش راست: کارت‌های ذخیره شده -->
      <div class="saved-cards-section">
        <h2 class="section-title">کارت‌های ذخیره شده</h2>
        
        <div v-if="isLoading" class="loading-state">
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <div v-else-if="savedCards.length === 0" class="no-cards-message">
          <VAlert
            type="info"
            variant="tonal"
            class="info-alert"
          >
            <template #prepend>
              <VIcon icon="bx-info-circle" />
            </template>
            هنوز کارتی برای این حساب ذخیره نشده است.
          </VAlert>
        </div>

        <div v-else class="cards-list">
          <VCard
            v-for="card in savedCards"
            :key="card.id"
            class="saved-card-item mb-4"
          >
            <VCardText>
              <div class="card-info">
                <div class="card-header">
                  <h3>{{ card.bankName }}</h3>
                </div>
                <div class="card-details">
                  <p><strong>دارنده کارت:</strong> {{ card.cardholderName }}</p>
                  <p><strong>شماره حساب:</strong> {{ card.accountNumber }}</p>
                  <p><strong>شماره شبا:</strong> {{ card.sheba }}</p>
                  <p><strong>تاریخ انقضا:</strong> {{ card.expirationMonth }}/{{ card.expirationYear }}</p>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bank-information-page {
  direction: rtl;
  padding: 24px;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));

  .page-title {
    text-align: center;
    margin-bottom: 32px;

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: rgb(var(--v-theme-on-surface));
    }
  }

  .main-content {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    max-width: 1400px;
    margin: 0 auto;
  }

  .form-section,
  .saved-cards-section {
    flex: 1;
    min-width: 300px;
    background: rgb(var(--v-theme-surface));
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 24px;
    color: rgb(var(--v-theme-on-surface));
  }

  .form-fields {
    .expiration-row {
      display: flex;
      gap: 16px;

      .expiration-month {
        flex: 1;
      }

      .expiration-year {
        flex: 1;
      }
    }


    .save-toggle {
      display: flex;
      align-items: center;
      padding: 8px 0;
    }

    .form-buttons {
      display: flex;
      gap: 16px;
      margin-top: 24px;

      .clear-btn {
        flex: 1;
      }

      .submit-btn {
        flex: 1;
      }
    }
  }

  .saved-cards-section {
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
    }

    .no-cards-message {
      .info-alert {
        background: rgba(33, 150, 243, 0.1);
        border: 1px solid rgba(33, 150, 243, 0.3);
        color: rgb(33, 150, 243);
      }
    }

    .cards-list {
      .saved-card-item {
        background: rgb(var(--v-theme-surface));
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

        .card-info {
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: rgb(var(--v-theme-on-surface));
            }

          }

          .card-details {
            p {
              margin: 8px 0;
              color: rgb(var(--v-theme-on-surface-variant));

              strong {
                color: rgb(var(--v-theme-on-surface));
              }
            }
          }
        }
      }
    }
  }

  // Responsive
  @media (max-width: 960px) {
    .main-content {
      flex-direction: column;
    }

    .form-section,
    .saved-cards-section {
      width: 100%;
    }
  }
}
</style>
