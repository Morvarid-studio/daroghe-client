<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import api from '@/lib/axios'
import { formatShamsiDate } from '@/utils/date'
import moment from 'jalali-moment'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

const route = useRoute()
const router = useRouter()
const { mdAndUp } = useDisplay()

interface Account {
  id: number
  account_type: 'employee' | 'company' | 'external' | 'petty_cash'
  display_name?: string
  owner_name?: string
  name?: string
  bank_name?: string
  account_number?: string
  sheba?: string
  user_id?: number
  user?: {
    id: number
    user_name: string
  }
  is_active: boolean
  tags?: Array<{
    id: number
    name: string
    color?: string
  }>
  description?: string
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
  invoice?: string
}

const account = ref<Account | null>(null)
const transactions = ref<Transaction[]>([])
const balance = ref(0)
const totalReceived = ref(0)
const totalCosts = ref(0)
const isLoading = ref(false)
const isAccountsLoading = ref(false)
const isSubmitting = ref(false)
const isTransactionDialogOpen = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const accounts = ref<Account[]>([])
const isArchiving = ref<number | null>(null)


const accountId = computed(() => {
  return parseInt(route.params.id as string)
})

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

// دریافت اطلاعات حساب، تراکنش‌ها و موجودی
const fetchData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const [accountResponse, transactionsResponse, balanceResponse] = await Promise.all([
      api.get(`/api/admin/accounts/${accountId.value}`),
      api.get(`/api/admin/accounts/${accountId.value}/transactions`),
      api.get(`/api/admin/accounts/${accountId.value}/balance`),
    ])
    
    account.value = accountResponse.data
    transactions.value = transactionsResponse.data.transactions
    balance.value = balanceResponse.data.balance
    totalReceived.value = balanceResponse.data.total_received
    totalCosts.value = balanceResponse.data.total_costs
  } catch (error: any) {
    if (error.response?.status === 404) {
      errorMessage.value = 'حساب یافت نشد.'
      router.push('/admin/accounts-management')
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

    const response = await api.post(`/api/admin/accounts/${accountId.value}/transactions`, formData)
    
    successMessage.value = 'تراکنش با موفقیت ثبت شد'
    isTransactionDialogOpen.value = false
    resetTransactionForm()
    
    // به‌روزرسانی داده‌ها
    await fetchData()
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
  // تنظیم حساب مورد نظر به عنوان یکی از حساب‌ها
  if (account.value) {
    transactionForm.value.from_account_id = account.value.id
  }
}

// بستن دیالوگ
const closeTransactionDialog = () => {
  isTransactionDialogOpen.value = false
  resetTransactionForm()
  errorMessage.value = ''
  successMessage.value = ''
}

// آرشیو کردن تراکنش
const archiveTransaction = async (transactionId: number) => {
  try {
    isArchiving.value = transactionId
    errorMessage.value = ''
    successMessage.value = ''
    
    await api.patch(`/api/admin/accounts/${accountId.value}/transactions/${transactionId}/archive`)
    
    successMessage.value = 'تراکنش با موفقیت آرشیو شد'
    
    // به‌روزرسانی داده‌ها
    await fetchData()
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'خطا در آرشیو کردن تراکنش'
    console.error(error)
  } finally {
    isArchiving.value = null
  }
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
    return account.display_name || 'حساب اصلی شرکت'
  }
  if (account.account_type === 'petty_cash' && account.user) {
    return `حساب تنخواه ${account.user.user_name}`
  }
  return account.display_name || account.name || 'نامشخص'
}

// دریافت نام نمایشی حساب
const getAccountDisplayName = (account: Account | null) => {
  if (!account) return 'نامشخص'
  return account.display_name || account.name || getAccountName(account)
}

// دریافت نوع حساب به فارسی
const getAccountTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    employee: 'کارمند',
    company: 'شرکت',
    external: 'خارجی',
    petty_cash: 'تنخواه'
  }
  return types[type] || type
}

onMounted(() => {
  fetchData()
  fetchAccounts()
})
</script>

<template>
  <div>
    <VRow>
      <!-- ستون راست: اطلاعات حساب -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard>
          <VCardItem>
            <template #prepend>
              <VBtn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="router.back()"
              >
                <VIcon
                  icon="bx-chevron-right"
                  size="24"
                />
              </VBtn>
            </template>
            <VCardTitle>داشبورد حساب</VCardTitle>
          </VCardItem>

          <VDivider />

          <VCardText v-if="account">
            <!-- نام حساب -->
            <div class="text-center mb-6">
              <VAvatar
                size="80"
                :color="account.account_type === 'employee' ? 'primary' : account.account_type === 'company' ? 'success' : account.account_type === 'petty_cash' ? 'info' : 'warning'"
                class="mb-4"
              >
                <VIcon
                  size="40"
                  icon="bx-wallet"
                />
              </VAvatar>
              <h5 class="text-h5 mb-2">
                {{ getAccountDisplayName(account) }}
              </h5>
              <VChip
                :color="account.account_type === 'employee' ? 'primary' : account.account_type === 'company' ? 'success' : account.account_type === 'petty_cash' ? 'info' : 'warning'"
                size="small"
              >
                {{ getAccountTypeLabel(account.account_type) }}
              </VChip>
            </div>

            <!-- موجودی حساب -->
            <VCard
              variant="outlined"
              class="mb-4"
            >
              <VCardText>
                <div class="text-center">
                  <div class="text-body-2 text-medium-emphasis mb-2">
                    موجودی حساب
                  </div>
                  <div
                    class="text-h4 mb-2"
                    :class="balance >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatAmount(balance) }} تومان
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    دریافت‌ها: {{ formatAmount(totalReceived) }} تومان
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    هزینه‌ها: {{ formatAmount(totalCosts) }} تومان
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- جزئیات حساب -->
            <div class="mb-4">
              <div class="text-body-2 text-medium-emphasis mb-3">
                جزئیات
              </div>
              <div class="d-flex flex-column gap-3">
                <div
                  v-if="account.owner_name"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">نام صاحب حساب:</span>
                  <span class="text-body-2 font-weight-medium">{{ account.owner_name }}</span>
                </div>
                <div
                  v-if="account.bank_name"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">بانک:</span>
                  <span class="text-body-2 font-weight-medium">{{ account.bank_name }}</span>
                </div>
                <div
                  v-if="account.user"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">کاربر:</span>
                  <span class="text-body-2 font-weight-medium">{{ account.user.user_name }}</span>
                </div>
                <div
                  v-if="account.account_number"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">شماره حساب:</span>
                  <span class="text-body-2 font-weight-medium">{{ account.account_number }}</span>
                </div>
                <div
                  v-if="account.sheba"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">شماره شبا:</span>
                  <span class="text-body-2 font-weight-medium">{{ account.sheba }}</span>
                </div>
                <div
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2 text-medium-emphasis">وضعیت:</span>
                  <VChip
                    size="small"
                    :color="account.is_active ? 'success' : 'error'"
                  >
                    {{ account.is_active ? 'فعال' : 'غیرفعال' }}
                  </VChip>
                </div>
                <div
                  v-if="account.tags && account.tags.length > 0"
                  class="d-flex flex-column gap-2"
                >
                  <span class="text-body-2 text-medium-emphasis">تگ‌ها:</span>
                  <div class="d-flex flex-wrap gap-1">
                    <VChip
                      v-for="tag in account.tags"
                      :key="tag.id"
                      size="x-small"
                      :color="tag.color || 'info'"
                      variant="tonal"
                    >
                      {{ tag.name }}
                    </VChip>
                  </div>
                </div>
                <div
                  v-if="account.description"
                  class="d-flex flex-column gap-2"
                >
                  <span class="text-body-2 text-medium-emphasis">توضیحات:</span>
                  <span class="text-body-2">{{ account.description }}</span>
                </div>
              </div>
            </div>

            <!-- دکمه ثبت تراکنش -->
            <VBtn
              block
              color="primary"
              @click="openTransactionDialog"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              ثبت تراکنش
            </VBtn>
          </VCardText>

          <VCardText v-else>
            <div class="text-center py-8">
              <VProgressCircular
                indeterminate
                color="primary"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- ستون چپ: لیست تراکنش‌ها -->
      <VCol
        cols="12"
        md="8"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>تراکنش‌ها</VCardTitle>
          </VCardItem>

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

            <!-- نمایش کارت‌ها -->
            <div
              v-if="!isLoading && transactions.length > 0"
              class="d-flex flex-column gap-4"
            >
              <VCard
                v-for="transaction in transactions"
                :key="transaction.id"
                variant="outlined"
              >
                <VCardText>
                  <div class="d-flex flex-column gap-3">
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-body-2 text-medium-emphasis">مبلغ:</span>
                      <div class="d-flex align-center gap-2">
                        <span
                          class="text-h6 font-weight-bold"
                          :class="transaction.type === 'receive' ? 'text-success' : 'text-error'"
                        >
                          {{ formatAmount(transaction.amount_decimal) }} تومان
                        </span>
                        <VBtn
                          icon
                          size="small"
                          variant="text"
                          color="error"
                          :loading="isArchiving === transaction.id"
                          @click="archiveTransaction(transaction.id)"
                        >
                          <VIcon icon="bx-archive" />
                        </VBtn>
                      </div>
                    </div>
                    <VDivider />
                    <!-- محتوای دو ستونه برای دسکتاپ، تک ستونه برای موبایل -->
                    <VRow v-if="mdAndUp">
                      <!-- ستون راست -->
                      <VCol cols="6">
                        <div class="d-flex flex-column gap-3">
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">تاریخ تراکنش:</span>
                            <span class="text-body-2 font-weight-medium">{{ formatShamsiDate(transaction.payment_date) }}</span>
                          </div>
                          <div
                            v-if="transaction.created_at_shamsi"
                            class="d-flex justify-space-between"
                          >
                            <span class="text-body-2 text-medium-emphasis">تاریخ ثبت:</span>
                            <span class="text-body-2 font-weight-medium">{{ formatShamsiDate(transaction.created_at_shamsi) }}</span>
                          </div>
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">از حساب:</span>
                            <span class="text-body-2 font-weight-medium text-end" style="max-width: 60%;">{{ getAccountName(transaction.from_account) }}</span>
                          </div>
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">دسته‌بندی:</span>
                            <span class="text-body-2 font-weight-medium">{{ transaction.category }}</span>
                          </div>
                        </div>
                      </VCol>
                      <!-- ستون چپ -->
                      <VCol cols="6">
                        <div class="d-flex flex-column gap-3">
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">نوع:</span>
                            <VChip
                              :color="transaction.type === 'receive' ? 'success' : 'error'"
                              size="small"
                            >
                              {{ transaction.type === 'receive' ? 'دریافت' : 'خرج' }}
                            </VChip>
                          </div>
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">ثبت‌کننده:</span>
                            <span class="text-body-2 font-weight-medium">{{ transaction.user.user_name }}</span>
                          </div>
                          <div class="d-flex justify-space-between">
                            <span class="text-body-2 text-medium-emphasis">به حساب:</span>
                            <span class="text-body-2 font-weight-medium text-end" style="max-width: 60%;">{{ getAccountName(transaction.to_account) }}</span>
                          </div>
                          <div
                            v-if="transaction.description"
                            class="d-flex flex-column gap-1"
                          >
                            <span class="text-body-2 text-medium-emphasis">توضیحات:</span>
                            <span class="text-body-2">{{ transaction.description }}</span>
                          </div>
                        </div>
                      </VCol>
                    </VRow>
                    <!-- محتوای تک ستونه برای موبایل -->
                    <div v-else class="d-flex flex-column gap-3">
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">نوع:</span>
                        <VChip
                          :color="transaction.type === 'receive' ? 'success' : 'error'"
                          size="small"
                        >
                          {{ transaction.type === 'receive' ? 'دریافت' : 'خرج' }}
                        </VChip>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">تاریخ تراکنش:</span>
                        <span class="text-body-2 font-weight-medium">{{ formatShamsiDate(transaction.payment_date) }}</span>
                      </div>
                      <div
                        v-if="transaction.created_at_shamsi"
                        class="d-flex justify-space-between"
                      >
                        <span class="text-body-2 text-medium-emphasis">تاریخ ثبت:</span>
                        <span class="text-body-2 font-weight-medium">{{ formatShamsiDate(transaction.created_at_shamsi) }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">از حساب:</span>
                        <span class="text-body-2 font-weight-medium text-end" style="max-width: 60%;">{{ getAccountName(transaction.from_account) }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">به حساب:</span>
                        <span class="text-body-2 font-weight-medium text-end" style="max-width: 60%;">{{ getAccountName(transaction.to_account) }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">دسته‌بندی:</span>
                        <span class="text-body-2 font-weight-medium">{{ transaction.category }}</span>
                      </div>
                      <div
                        v-if="transaction.description"
                        class="d-flex flex-column gap-1"
                      >
                        <span class="text-body-2 text-medium-emphasis">توضیحات:</span>
                        <span class="text-body-2">{{ transaction.description }}</span>
                      </div>
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2 text-medium-emphasis">ثبت‌کننده:</span>
                        <span class="text-body-2 font-weight-medium">{{ transaction.user.user_name }}</span>
                      </div>
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>

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
