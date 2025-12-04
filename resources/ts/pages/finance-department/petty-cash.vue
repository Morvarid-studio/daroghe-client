<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import { formatShamsiDate } from '@/utils/date'
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
  created_at_shamsi?: string
  amount_decimal: number
  category: string
  type: 'cost' | 'receive'
  description?: string
  from_account: Account
  to_account: Account
  user: {
    id: number
    user_name: string
  }
}

const pettyCashAccount = ref<Account | null>(null)
const transactions = ref<Transaction[]>([])
const balance = ref(0)
const isLoading = ref(false)
const isAccountsLoading = ref(false)
const isSubmitting = ref(false)
const isTransactionDialogOpen = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const accounts = ref<Account[]>([])

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

// دریافت حساب تنخواه و تراکنش‌ها
const fetchData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const [accountResponse, transactionsResponse, balanceResponse] = await Promise.all([
      api.get('/api/petty-cash/account'),
      api.get('/api/petty-cash/transactions'),
      api.get('/api/petty-cash/balance'),
    ])
    
    pettyCashAccount.value = accountResponse.data
    transactions.value = transactionsResponse.data.transactions
    balance.value = balanceResponse.data.balance
  } catch (error: any) {
    if (error.response?.status === 404) {
      errorMessage.value = 'حساب تنخواهی برای شما یافت نشد. لطفاً با مدیر تماس بگیرید.'
    } else {
      errorMessage.value = error.response?.data?.message || 'خطا در دریافت اطلاعات'
    }
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

// فرمت کردن مبلغ
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fa-IR').format(amount)
}

// computed برای نمایش مبلغ به حروف
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

    const response = await api.post('/api/petty-cash/transactions', formData)
    
    successMessage.value = 'تراکنش با موفقیت ثبت شد'
    isTransactionDialogOpen.value = false
    resetTransactionForm()
    
    // اضافه کردن تراکنش جدید به ابتدای لیست
    if (response.data?.data) {
      transactions.value.unshift(response.data.data)
      // به‌روزرسانی موجودی
      await fetchData()
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
  isTransactionDialogOpen.value = true
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

// دریافت نام حساب
const getAccountName = (account: Account) => {
  if (account.account_type === 'employee' && account.user) {
    const parts: string[] = []
    if (account.user.user_name) parts.push(account.user.user_name)
    if (account.bank_name) parts.push(account.bank_name)
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

onMounted(() => {
  fetchData()
  fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            مدیریت حساب تنخواه
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

            <VAlert
              v-if="pettyCashAccount"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  <strong>موجودی حساب تنخواه:</strong>
                  <span class="text-h5 ms-2">{{ formatAmount(balance) }} تومان</span>
                </div>
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
              </div>
            </VAlert>

            <VTable v-if="!isLoading && transactions.length > 0">
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
                      {{ transaction.type === 'receive' ? 'دریافت' : 'خرج' }}
                    </VChip>
                  </td>
                  <td>{{ transaction.category }}</td>
                  <td>{{ transaction.description || '-' }}</td>
                </tr>
              </tbody>
            </VTable>

            <VAlert
              v-else-if="!isLoading && transactions.length === 0"
              type="info"
              variant="tonal"
            >
              هنوز تراکنشی ثبت نشده است.
            </VAlert>

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
  </div>
</template>

