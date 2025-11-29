<template>
  <v-container class="pa-6" style="background:#0d0f2a; color:white;">
    <div class="d-flex justify-center">
      <h2 class="text-h5 mb-6">اطلاعات بانکی</h2>
    </div>

    <v-row>
      <v-col cols="12" md="7" order-md="2">
        <v-card class="pa-6" style="background:#15172f; border:1px solid #2a2c45;">
          <div class="d-flex justify-end">
            <h3 class="text-h6 mb-4 ">افزودن کارت جدید</h3>
          </div>

          <v-form ref="bankForm" dir="rtl">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="نام کامل دارنده کارت"
                  variant="outlined"
                  density="comfortable"
                  v-model="newCard.name"
                  :rules="[v => !!v || 'نام دارنده کارت الزامی است']"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="شماره حساب"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  v-model="newCard.accountNumber"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="شماره کارت (۱۶ رقمی)"
                  variant="outlined"
                  density="comfortable"
                  type="number"
                  maxlength="16"
                  v-model="newCard.cardNumber"
                  :rules="[
                    v => !!v || 'شماره کارت الزامی است',
                    v => (v && v.length === 16) || 'شماره کارت باید ۱۶ رقم باشد'
                  ]"
                  placeholder="0000 0000 0000 0000"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="نام بانک"
                  variant="outlined"
                  density="comfortable"
                  v-model="newCard.bankName"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-row>
                  <v-col cols="4">
                    <v-text-field
                      label="ماه (مثلا ۰۱)"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      maxlength="2"
                      v-model="newCard.expireMonth"
                      :rules="[
                        v => !!v || 'ماه الزامی است',
                        v => (v && v.length <= 2) || 'ماه باید ۲ رقم باشد',
                        v => (v >= 1 && v <= 12) || 'ماه معتبر نیست'
                      ]"
                      clearable
                    />
                  </v-col>

                  <v-col cols="4">
                    <v-text-field
                      label="سال (مثلا ۱۴۰۵)"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      maxlength="4"
                      v-model="newCard.expireYear"
                      :rules="[
                        v => !!v || 'سال الزامی است',
                        v => (v && v.length === 4) || 'سال باید ۴ رقم باشد'
                      ]"
                      clearable
                    />
                  </v-col>

                  <v-col cols="4">
                    <v-text-field
                      label="CVV2"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      maxlength="4"
                      v-model="newCard.cvv2"
                      :rules="[
                        v => !!v || 'CVV2 الزامی است',
                        v => (v && v.length >= 3 && v.length <= 4) || 'CVV2 باید ۳ یا ۴ رقم باشد'
                      ]"
                      clearable
                    />
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="شماره شبا (IR + ۲۴ رقم)"
                  variant="outlined"
                  density="comfortable"
                  maxlength="26"
                  v-model="newCard.sheba"
                  :rules="[v => (v && v.length === 26) || 'شماره شبا باید ۲۶ کاراکتر باشد']"
                  placeholder="IR........................"
                  clearable
                />
              </v-col>

              <v-col cols="12" class="mt-4">
                <div class="d-flex justify-start">
                  <v-switch
                    label="ذخیره این کارت برای پرداخت‌های آینده؟"
                    color="primary"
                    v-model="newCard.saveCard"
                    inset
                  />
                </div>
              </v-col>

              <v-col cols="12" class="d-flex gap-4 mt-4 justify-start">
                <v-btn color="primary" variant="flat" class="px-6" @click="submitForm">ثبت کارت</v-btn>
                <v-btn color="grey" variant="flat" class="px-6" @click="resetForm">پاک کردن فرم</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" md="5" order-md="1">
        <div class="d-flex justify-end">
          <h3 class="text-h6 mb-4">کارت‌های ذخیره شده</h3>
        </div>

        <div v-if="savedCards.length === 0">
          <v-card class="pa-5 mb-4" style="background:#15172f; border:1px solid #2a2c45;">
            <v-alert type="info" variant="tonal" class="text-right" dir="rtl">
              هنوز کارتی برای این حساب ذخیره نشده است.
            </v-alert>
          </v-card>
        </div>

        <v-card
          v-for="(card) in savedCards"
          :key="card.id"
          class="pa-5 mb-4 card-item"
          style="background:#15172f; border:1px solid #2a2c45;"
          dir="rtl"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <strong class="text-white">{{ card.name }}</strong>
              <div class="text-grey" dir="ltr">
                **** **** **** {{ card.lastFour }}
              </div>
              <small class="text-grey"
              >انقضا: {{ card.expireMonth }}/{{ card.expireYear }}</small
              >
            </div>
            <div class="d-flex flex-column gap-2 rtl-buttons">
              <v-btn
                color="primary"
                size="small"
                variant="flat"
                @click="openEditDialog(card)"
              >ویرایش</v-btn
              >
              <v-btn
                color="red"
                size="small"
                variant="flat"
                @click="openDeleteDialog(card.lastFour, card.id)"
              >حذف</v-btn
              >
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="editDialog" max-width="500px">
      <v-card style="background:#15172f; border:1px solid #2a2c45;" class="pa-6" dir="rtl">
        <h3 class="text-h6 mb-4 text-right">ویرایش کارت: {{ currentCard.lastFour }}</h3>

        <v-form ref="editForm">
          <v-text-field
            label="نام دارنده کارت"
            variant="outlined"
            density="comfortable"
            v-model="currentCard.name"
            :rules="[v => !!v || 'نام دارنده کارت الزامی است']"
          />

          <v-text-field
            label="چهار رقم آخر کارت"
            variant="outlined"
            density="comfortable"
            v-model="currentCard.lastFour"
            disabled
            dir="ltr"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                label="ماه انقضا (MM)"
                variant="outlined"
                density="comfortable"
                v-model="currentCard.expireMonth"
                maxlength="2"
                type="number"
                :rules="[v => !!v || 'ماه الزامی است']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="سال انقضا (YY)"
                variant="outlined"
                density="comfortable"
                v-model="currentCard.expireYear"
                maxlength="4"
                type="number"
                :rules="[v => !!v || 'سال الزامی است']"
              />
            </v-col>
          </v-row>
        </v-form>

        <v-switch label="تنظیم به عنوان کارت پیش فرض؟" color="primary" inset />

        <div class="d-flex gap-4 mt-4 justify-end">
          <v-btn color="primary" class="px-6" @click="saveEdit">ذخیره ویرایش</v-btn>
          <v-btn color="grey" class="px-6" @click="editDialog = false">انصراف</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card style="background:#15172f; border:1px solid #2a2c45;" class="pa-6" dir="rtl">
        <h3 class="text-h6 mb-4 text-right">حذف کارت</h3>
        <p class="mb-6">آیا مطمئن هستید که می‌خواهید کارت با شماره **** {{ cardToDeleteFourDigits }} را حذف کنید؟ این عمل قابل برگشت نیست.</p>

        <div class="d-flex gap-4 mt-4 justify-end">
          <v-btn color="red" variant="flat" class="px-6" @click="confirmDelete">تأیید حذف</v-btn>
          <v-btn color="grey" variant="flat" class="px-6" @click="deleteDialog = false">انصراف</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

// رفرنس به فرم‌ها برای دسترسی به متدهای اعتبارسنجی
const bankForm = ref(null)
const editForm = ref(null)

// مدل داده برای فرم جدید
const newCard = ref({
  name: null,
  accountNumber: null,
  cardNumber: null,
  bankName: null,
  expireMonth: null,
  expireYear: null,
  cvv2: null,
  sheba: null,
  saveCard: false,
})

// --- متغیرهای کارت‌های ذخیره شده (خالی شده) ---
const savedCards = ref([]) // این آرایه اکنون خالی است.

// --- منطق ثبت فرم جدید ---
const submitForm = async () => {
  // ۱. اعتبارسنجی فرم ثبت کارت جدید
  const { valid } = await bankForm.value.validate()

  if (valid) {
    // ۲. منطق ارسال اطلاعات به سرور باید اینجا باشد
    console.log('--- ثبت کارت جدید ---')
    console.log('اطلاعات کارت: ', newCard.value)

    // شبیه سازی اضافه شدن کارت جدید به لیست ذخیره شده برای تست فعال بودن
    const lastFour = newCard.value.cardNumber ? newCard.value.cardNumber.slice(-4) : '0000'
    savedCards.value.push({
      id: Date.now(),
      name: newCard.value.name,
      lastFour: lastFour,
      expireMonth: newCard.value.expireMonth,
      expireYear: newCard.value.expireYear,
    })

    // ۳. پاک کردن فرم پس از ارسال
    resetForm()
  } else {
    console.log('اعتبارسنجی فرم ثبت کارت جدید شکست خورد.')
  }
}

const resetForm = () => {
  // با استفاده از متد reset خود Vuetify فرم را پاک می کنیم
  bankForm.value.reset()
}


// --- متغیرهای دیالوگ ویرایش ---
const editDialog = ref(false)
const currentCard = ref({})

const openEditDialog = (card) => {
  // کپی عمیق اطلاعات کارت برای ویرایش
  currentCard.value = JSON.parse(JSON.stringify(card))
  editDialog.value = true
}

const saveEdit = async () => {
  // ۱. اعتبارسنجی فرم ویرایش
  const { valid } = await editForm.value.validate()

  if (valid) {
    // ۲. منطق ذخیره به سرور باید اینجا باشد
    console.log('--- ذخیره ویرایش ---')
    console.log('کارت ویرایش شده:', currentCard.value)

    // شبیه‌سازی به‌روزرسانی در لیست ذخیره شده فعلی
    const index = savedCards.value.findIndex(c => c.id === currentCard.value.id)
    if (index !== -1) {
      // به‌روزرسانی کارت در آرایه اصلی
      savedCards.value[index] = currentCard.value
    }

    editDialog.value = false
  } else {
    console.log('اعتبارسنجی فرم ویرایش شکست خورد.')
  }
}

// --- متغیرها و منطق دیالوگ حذف ---
const deleteDialog = ref(false)
const cardToDeleteId = ref(null)
const cardToDeleteFourDigits = ref(null)

const openDeleteDialog = (lastFour, id) => {
  cardToDeleteFourDigits.value = lastFour
  cardToDeleteId.value = id
  deleteDialog.value = true
}

const confirmDelete = () => {
  // منطق واقعی حذف کارت از API یا لیست savedCards
  console.log(`--- حذف کارت ---`)
  console.log(`کارت با ID: ${cardToDeleteId.value} و ۴ رقم آخر ${cardToDeleteFourDigits.value} حذف شد.`)

  // شبیه‌سازی: فیلتر کردن کارت حذف شده از لیست
  savedCards.value = savedCards.value.filter(card => card.id !== cardToDeleteId.value)
  deleteDialog.value = false
}
</script>

<style>
.text-grey {
  color: #9aa0c2 !important;
}

/* -------------------------------
   ۱) راست‌چین کردن لیبل تمام فیلدهای Vuetify 3
-------------------------------- */
/* راست‌چین کردن لیبل‌ها */
.v-label.v-field-label {
  text-align: right !important;
  direction: rtl !important;
  justify-content: flex-start !important;
  width: 100% !important;
  display: flex !important;
}


/* -------------------------------
   ۲) راست‌چین کردن متن ورودی‌ها
-------------------------------- */
.v-field {
  direction: rtl !important;
  text-align: right !important;
  justify-content: flex-end !important;
}

.v-field__input::placeholder {
  text-align: right !important;
}

/* -------------------------------
   ۳) استثناء برای فیلدهای عددی
      شماره کارت – شبا – ماه – سال – cvv
-------------------------------- */
input[type="number"],
.v-text-field input[placeholder^="0000"],
.v-text-field input[placeholder^="IR"] {
  direction: ltr !important;
  text-align: left !important;
}

/* -------------------------------
   ۴) راست‌چین کردن پیام‌های خطا و جزئیات
-------------------------------- */
.v-input__details {
  direction: rtl !important;
  text-align: right !important;
}

/* -------------------------------
   ۵) سوییچ ها
-------------------------------- */
.v-switch .v-label {
  margin-right: auto !important;
}

/* -------------------------------
   ۶) فاصله بین دکمه‌ها
-------------------------------- */
.gap-4 {
  gap: 1rem !important;
}
/* ===========================
   راست‌چین کردن لیبل های Vuetify 3 Outlined
   نسخه کاملاً تست شده
=========================== */
.v-field--variant-outlined .v-field-label {
  right: 10px !important;         /* جایگاه لیبل را از راست ست می‌کند */
  left: auto !important;          /* جایگاه پیش‌فرض از چپ را حذف می‌کند */
  transform-origin: right center !important;
  text-align: right !important;
  direction: rtl !important;
}

.v-field--variant-outlined.v-field--active .v-field-label,
.v-field--variant-outlined.v-field--focused .v-field-label,
.v-field--variant-outlined.v-field--dirty .v-field-label {
  right: 10px !important;
  left: auto !important;
  transform-origin: right !important;
  text-align: right !important;
  direction: rtl !important;
}


</style>
