<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import { formatToJalali, formatShamsiDate } from '@/utils/date'
import moment from 'jalali-moment'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

interface Account {
  id: number
  name?: string
  bank_name?: string
  account_type: string
  user?: {
    id: number
    user_name: string
  }
}

interface Transaction {
  id: number
  payment_date: string
  created_at?: string
  created_at_shamsi?: string
  amount_decimal: number
  category: string
  type: 'cost' | 'receive' // محاسبه شده به صورت خودکار
  description?: string
  from_account: Account
  to_account: Account
  user: {
    id: number
    user_name: string
  }
  invoice?: string
}

const transactions = ref<Transaction[]>([])
const companyAccount = ref<Account | null>(null)
const isLoading = ref(false)
const isAccountsLoading = ref(false)
const isSubmitting = ref(false)
const isTransactionDialogOpen = ref(false)
const isArchiveDialogOpen = ref(false)
const transactionToArchive = ref<Transaction | null>(null)
const errorMessage = ref('')
const successMessage = ref('')

// فرم ثبت تراکنش
const transactionForm = ref({
  payment_date: '',
  amount_decimal: 0,
  category: '',
  from_account_id: null as number | null,
  to_account_id: null as number | null,
  description: '',
  invoice: null as File | null,
})

const accounts = ref<Account[]>([])

// دریافت تراکنش‌های حساب اصلی
const fetchTransactions = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await api.get('/api/admin/company-account/transactions')
    companyAccount.value = response.data.company_account
    transactions.value = response.data.transactions
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در دریافت تراکنش‌ها'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// دریافت لیست حساب‌ها برای ثبت تراکنش
const fetchAccounts = async () => {
  try {
    isAccountsLoading.value = true
    const response = await api.get('/api/accounts/for-transaction')
    accounts.value = response.data
  } catch (error: any) {
    console.error('خطا در دریافت حساب‌ها:', error)
    errorMessage.value = 'خطا در دریافت حساب‌ها'
  } finally {
    isAccountsLoading.value = false
  }
}

// تبدیل عدد به حروف (مثلاً 1 → "1 هزار تومان")
const convertAmountToText = (amount: number): string => {
  if (!amount || amount === 0) return ''
  
  const absAmount = Math.abs(amount)
  
  if (absAmount < 1000) {
    return `${formatAmount(amount)} تومان`
  } else if (absAmount < 1000000) {
    const thousands = Math.floor(absAmount / 1000)
    const remainder = absAmount % 1000
    if (remainder === 0) {
      return `${formatAmount(thousands)} هزار تومان`
    } else {
      return `${formatAmount(thousands)} هزار و ${formatAmount(remainder)} تومان`
    }
  } else if (absAmount < 1000000000) {
    const millions = Math.floor(absAmount / 1000000)
    const remainder = absAmount % 1000000
    if (remainder === 0) {
      return `${formatAmount(millions)} میلیون تومان`
    } else {
      const thousands = Math.floor(remainder / 1000)
      const remainderThousands = remainder % 1000
      if (remainderThousands === 0) {
        return `${formatAmount(millions)} میلیون و ${formatAmount(thousands)} هزار تومان`
      } else {
        return `${formatAmount(millions)} میلیون و ${formatAmount(thousands)} هزار و ${formatAmount(remainderThousands)} تومان`
      }
    }
  } else {
    const billions = Math.floor(absAmount / 1000000000)
    const remainder = absAmount % 1000000000
    if (remainder === 0) {
      return `${formatAmount(billions)} میلیارد تومان`
    } else {
      const millions = Math.floor(remainder / 1000000)
      const remainderMillions = remainder % 1000000
      if (remainderMillions === 0) {
        return `${formatAmount(billions)} میلیارد و ${formatAmount(millions)} میلیون تومان`
      } else {
        const thousands = Math.floor(remainderMillions / 1000)
        const remainderThousands = remainderMillions % 1000
        if (remainderThousands === 0) {
          return `${formatAmount(billions)} میلیارد و ${formatAmount(millions)} میلیون و ${formatAmount(thousands)} هزار تومان`
        } else {
          return `${formatAmount(billions)} میلیارد و ${formatAmount(millions)} میلیون و ${formatAmount(thousands)} هزار و ${formatAmount(remainderThousands)} تومان`
        }
      }
    }
  }
}

// computed برای نمایش مبلغ به حروف
const amountText = computed(() => {
  if (!transactionForm.value.amount_decimal || transactionForm.value.amount_decimal === 0) {
    return ''
  }
  return convertAmountToText(transactionForm.value.amount_decimal)
})

// ثبت تراکنش
const submitTransaction = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    isSubmitting.value = true
    
    if (!transactionForm.value.payment_date || !transactionForm.value.from_account_id || !transactionForm.value.to_account_id) {
      errorMessage.value = 'لطفاً تمام فیلدهای الزامی را پر کنید'
      return
    }

    // تبدیل تاریخ به فرمت شمسی برای ارسال به سرور
    let paymentDate = transactionForm.value.payment_date
    if (paymentDate && paymentDate.includes('-')) {
      // اگر تاریخ به فرمت میلادی است (Y-m-d)، به شمسی تبدیل می‌کنیم
      const momentDate = moment(paymentDate, 'YYYY-MM-DD')
      if (momentDate.isValid()) {
        paymentDate = momentDate.format('jYYYY/jMM/jDD')
      }
    }

    const formData = new FormData()
    formData.append('payment_date', paymentDate)
    formData.append('amount_decimal', transactionForm.value.amount_decimal.toString())
    formData.append('category', transactionForm.value.category)
    formData.append('from_account_id', transactionForm.value.from_account_id.toString())
    formData.append('to_account_id', transactionForm.value.to_account_id.toString())
    if (transactionForm.value.description) {
      formData.append('description', transactionForm.value.description)
    }
    if (transactionForm.value.invoice) {
      formData.append('invoice', transactionForm.value.invoice)
    }

    const response = await api.post('/api/admin/company-account/transactions', formData)
    
    successMessage.value = 'تراکنش با موفقیت ثبت شد'
    isTransactionDialogOpen.value = false
    resetTransactionForm()
    
    // اضافه کردن تراکنش جدید به ابتدای لیست بدون fetch کامل (سریع‌تر)
    if (response.data?.data) {
      const newTransaction = response.data.data
      // اضافه کردن به ابتدای لیست
      transactions.value.unshift(newTransaction)
    } else {
      // اگر response کامل نبود، fetch کنیم (fallback)
      fetchTransactions()
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در ثبت تراکنش'
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

// ریست کردن فرم
const resetTransactionForm = () => {
  transactionForm.value = {
    payment_date: '',
    amount_decimal: 0,
    category: '',
    from_account_id: null,
    to_account_id: null,
    description: '',
    invoice: null,
  }
}

// باز کردن دیالوگ ثبت تراکنش
const openTransactionDialog = () => {
  // دیالوگ را فوراً باز کن (حساب‌ها از قبل در onMounted بارگذاری شده‌اند)
  isTransactionDialogOpen.value = true
  // اگر حساب‌ها هنوز بارگذاری نشده‌اند، در پس‌زمینه بارگذاری کن
  if (accounts.value.length === 0 && !isAccountsLoading.value) {
    fetchAccounts()
  }
}

// بستن دیالوگ
const closeTransactionDialog = () => {
  isTransactionDialogOpen.value = false
  resetTransactionForm()
  errorMessage.value = ''
  successMessage.value = ''
}

// فرمت کردن مبلغ
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fa-IR').format(amount)
}

// آرشیو کردن تراکنش
const archiveTransaction = async () => {
  if (!transactionToArchive.value) return
  
  try {
    errorMessage.value = ''
    await api.patch(`/api/admin/company-account/transactions/${transactionToArchive.value.id}/archive`)
    successMessage.value = 'تراکنش با موفقیت آرشیو شد'
    isArchiveDialogOpen.value = false
    transactionToArchive.value = null
    await fetchTransactions()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در آرشیو تراکنش'
    console.error(error)
  }
}

// باز کردن دیالوگ آرشیو
const openArchiveDialog = (transaction: Transaction) => {
  transactionToArchive.value = transaction
  isArchiveDialogOpen.value = true
}

// دریافت نام حساب
const getAccountName = (account: Account) => {
  if (account.account_type === 'employee' && account.user) {
    // برای حساب کارمند: نام کاربر، نام بانک، کارمند
    const parts: string[] = []
    if (account.user.user_name) parts.push(account.user.user_name)
    if (account.bank_name) parts.push(account.bank_name)
    parts.push('کارمند')
    return parts.join('، ')
  }
  if (account.account_type === 'petty_cash' && account.user) {
    return `حساب تنخواه ${account.user.user_name}`
  }
  if (account.account_type === 'external' && account.name) {
    return account.name
  }
  if (account.account_type === 'company') {
    return 'حساب اصلی شرکت'
  }
  return 'نامشخص'
}

onMounted(() => {
  fetchTransactions()
  // بارگذاری حساب‌ها در پس‌زمینه (برای استفاده در دیالوگ)
  // بدون await تا صفحه سریع‌تر بارگذاری شود
  fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>مدیریت حساب اصلی شرکت</span>
            <VBtn
              color="primary"
              @click="openTransactionDialog"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              ثبت تراکنش
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

            <VTable v-if="!isLoading">
              <thead>
                <tr>
                  <th>تاریخ تراکنش</th>
                  <th>تاریخ ثبت</th>
                  <th>از حساب</th>
                  <th>به حساب</th>
                  <th>مبلغ</th>
                  <th>نوع</th>
                  <th>دسته‌بندی</th>
                  <th>توضیحات</th>
                  <th>ثبت‌کننده</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in transactions"
                  :key="transaction.id"
                >
                  <td>{{ formatShamsiDate(transaction.payment_date) }}</td>
                  <td>{{ transaction.created_at_shamsi ? formatShamsiDate(transaction.created_at_shamsi) : '-' }}</td>
                  <td>{{ getAccountName(transaction.from_account) }}</td>
                  <td>{{ getAccountName(transaction.to_account) }}</td>
                  <td>{{ formatAmount(transaction.amount_decimal) }} تومان</td>
                  <td>
                    <VChip
                      :color="transaction.type === 'receive' ? 'success' : 'error'"
                      size="small"
                    >
                      {{ transaction.type === 'receive' ? 'دریافت' : 'هزینه' }}
                    </VChip>
                  </td>
                  <td>{{ transaction.category }}</td>
                  <td>{{ transaction.description || '-' }}</td>
                  <td>{{ transaction.user.user_name }}</td>
                  <td>
                    <VBtn
                      icon
                      size="small"
                      color="warning"
                      variant="text"
                      @click="openArchiveDialog(transaction)"
                    >
                      <VIcon icon="bx-archive" />
                    </VBtn>
                  </td>
                </tr>
                <tr v-if="transactions.length === 0">
                  <td
                    colspan="10"
                    class="text-center"
                  >
                    تراکنشی یافت نشد
                  </td>
                </tr>
              </tbody>
            </VTable>

            <div
              v-if="isLoading"
              class="text-center py-8"
            >
              <VProgressCircular
                indeterminate
                color="primary"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- دیالوگ ثبت تراکنش -->
    <VDialog
      v-model="isTransactionDialogOpen"
      max-width="600"
    >
      <VCard>
        <VCardTitle>
          ثبت تراکنش جدید
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

          <VForm @submit.prevent="submitTransaction">
            <VRow>
              <VCol cols="12">
                <AppDateTimePicker
                  v-model="transactionForm.payment_date"
                  calendar="jalali"
                  label="تاریخ پرداخت"
                  placeholder="انتخاب تاریخ"
                  :config="{
                    altInput: true,
                    altFormat: 'Y/m/d',
                    dateFormat: 'Y-m-d',
                  }"
                  required
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="transactionForm.from_account_id"
                  :items="accounts"
                  item-title="name"
                  item-value="id"
                  label="از حساب"
                  :loading="isAccountsLoading"
                  required
                >
                  <template #item="{ props, item }">
                    <VListItem
                      v-bind="props"
                      :title="getAccountName(item.raw)"
                    />
                  </template>
                  <template #selection="{ item }">
                    {{ getAccountName(item.raw) }}
                  </template>
                </AppSelect>
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="transactionForm.to_account_id"
                  :items="accounts"
                  item-title="name"
                  item-value="id"
                  label="به حساب"
                  :loading="isAccountsLoading"
                  required
                >
                  <template #item="{ props, item }">
                    <VListItem
                      v-bind="props"
                      :title="getAccountName(item.raw)"
                    />
                  </template>
                  <template #selection="{ item }">
                    {{ getAccountName(item.raw) }}
                  </template>
                </AppSelect>
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model.number="transactionForm.amount_decimal"
                  label="مبلغ"
                  type="number"
                  required
                />
                <div
                  v-if="amountText"
                  class="text-body-2 text-primary mt-2"
                >
                  {{ amountText }}
                </div>
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="transactionForm.category"
                  label="دسته‌بندی"
                  required
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="transactionForm.description"
                  label="توضیحات"
                  rows="3"
                />
              </VCol>

              <VCol cols="12">
                <VFileInput
                  v-model="transactionForm.invoice"
                  label="فاکتور (PDF/DOC)"
                  accept=".pdf,.doc,.docx"
                  show-size
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
            @click="closeTransactionDialog"
          >
            انصراف
          </VBtn>
          <VBtn
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="submitTransaction"
          >
            ثبت
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- دیالوگ تایید آرشیو -->
    <VDialog
      v-model="isArchiveDialogOpen"
      max-width="400"
    >
      <VCard>
        <VCardTitle>تایید آرشیو</VCardTitle>
        <VDivider />
        <VCardText>
          آیا از آرشیو کردن این تراکنش اطمینان دارید؟
          <div class="mt-2 text-body-2">
            <strong>مبلغ:</strong> {{ transactionToArchive ? formatAmount(transactionToArchive.amount_decimal) + ' تومان' : '' }}
          </div>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="isArchiveDialogOpen = false"
          >
            انصراف
          </VBtn>
          <VBtn
            color="warning"
            @click="archiveTransaction"
          >
            آرشیو
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

