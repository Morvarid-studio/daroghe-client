<template>
  <div class="main-layout">

    <!-- ---------------------- لیست کارها سمت چپ ---------------------- -->
    <div class="list-box">
      <h3>لیست کارها</h3>
      <div v-if="visibleTasks.length === 0" class="no-items-message">
        هیچ کار فعالی برای نمایش وجود ندارد
      </div>

      <div v-for="item in visibleTasks" :key="item.id" class="task-item">
        <div class="task-content">
          <strong>{{ item.date }}</strong>
          <div>ساعت اعشاری: {{ item.hourDecimal }}</div>
          <div>{{ item.desc }}</div>
        </div>
        <button class="delete-btn" @click="archiveItem(item.id)">
          <i class='bx bx-archive-in'></i>
        </button>
      </div>
    </div>

    <!-- ---------------------- فرم ثبت کار سمت راست ---------------------- -->
    <div class="form-box">
      <h3>ثبت کار جدید</h3>

      <div class="input-row">
        <label>تاریخ</label>
        <VueDatePicker
          v-model="date"
          format="YYYY-MM-DD"
          :disable="disableOldDates"
          :max-date="today"
          @change="validateDate"
        />
      </div>

      <div class="input-row">
        <label>ساعت</label>
        <input type="number" v-model="hour" min="0" max="23" @blur="validateHour" />
      </div>

      <div class="input-row">
        <label>دقیقه</label>
        <input type="number" v-model="minute" min="0" max="59" @blur="validateMinute" />
      </div>

      <div class="input-row">
        <label>توضیحات</label>
        <textarea v-model="desc"></textarea>
      </div>

      <button class="submit-btn" @click="submitTask">
        ثبت نهایی
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VueDatePicker from 'vue3-persian-datetime-picker'

// فرم
const date = ref("")
const hour = ref("")
const minute = ref("")
const desc = ref("")

// دیتای اصلی
const tasks = ref([])
const archive = ref([])

const today = new Date()

// ============= ولیدیشن تاریخ (قانون ۳ روز و آینده) =============
function disableOldDates(dateObj) {
  const diff = (today - dateObj) / (1000 * 60 * 60 * 24)
  return diff > 3 || dateObj > today
}

function validateDate(value) {
  if (!value) return
  const selected = new Date(value)
  const diff = (today - selected) / (1000 * 60 * 60 * 24)

  if (diff > 3) {
    alert("انتخاب تاریخ بیش از ۳ روز قبل مجاز نیست.")
    date.value = ""
  }
  if (selected > today) {
    alert("انتخاب تاریخ آینده مجاز نیست.")
    date.value = ""
  }
}

// ============= ولیدیشن ساعت/دقیقه =============
function validateHour() {
  if (hour.value === "" || hour.value < 0 || hour.value > 23) {
    alert("ساعت باید بین 0 تا 23 باشد.")
    hour.value = ""
  }
}

function validateMinute() {
  if (minute.value === "" || minute.value < 0 || minute.value > 59) {
    alert("دقیقه باید بین 0 تا 59 باشد.")
    minute.value = ""
  }
}

// ============= ثبت کار =============
function submitTask() {
  if (!date.value || hour.value === "" || minute.value === "" || !desc.value) {
    alert("لطفا فرم را کامل پر کنید.")
    return
  }

  // تبدیل دقیقه → ساعت اعشاری
  const hourDecimal = Number((Number(hour.value) + Number(minute.value) / 60).toFixed(2))

  const newTask = {
    id: Date.now(),
    date: date.value,
    hourDecimal,
    desc: desc.value,
    createdAt: new Date()
  }

  tasks.value.unshift(newTask)

  date.value = ""
  hour.value = ""
  minute.value = ""
  desc.value = ""
}

// ============= آرشیو =============
function archiveItem(id) {
  const confirmDelete = confirm("آیا مطمئن هستید می‌خواهید این کار را حذف کنید؟");

  if (!confirmDelete) return; // لغو شد

  const item = tasks.value.find(t => t.id === id)
  if (item) {
    archive.value.push(item)
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

}

// ============= قانون نمایش ۳ روزه =============
const visibleTasks = computed(() => {
  return tasks.value.filter(task => {
    const diff = (today - new Date(task.date)) / (1000 * 60 * 60 * 24)
    return diff <= 3
  })
})
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: row-reverse; /* فرم سمت راست، لیست سمت چپ */
  gap: 20px;
  flex-wrap: wrap;
  direction: rtl; /* همه راست چین */
  font-family: 'BNazanin', Tahoma, sans-serif;
}

/* فرم */
.form-box {
  width: 48%;
  min-height: 400px;
  background-color: #2b2b40;
  color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

/* لیست */
.list-box {
  width: 48%;
  min-height: 500px;
  background-color: #2b2b40;
  color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  overflow-y: auto; /* اسکرول */
  max-height: 500px; /* محدودیت */
  display: flex;
  flex-direction: column;
}

/* موبایل */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  .form-box,
  .list-box {
    width: 100%;
  }
}

/* ردیف‌های ورودی */
.input-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

/* دکمه ثبت */
.submit-btn {
  background-color: #7367F0;
  color: white;
  padding: 12px;
  width: 100%;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 10px rgba(115,103,240,0.4);
}

.submit-btn:hover {
  background-color: #5e50ee;
  box-shadow: 0 6px 14px rgba(115,103,240,0.45);
}

/* آیتم‌های لیست */
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #1e1e2d;
  border: 1px solid #44446a;
}

.task-item:hover {
  background-color: #383850;
}

/* دکمه آرشیو */
.delete-btn {
  background: none;
  border: none;
  color: #ff5252;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ffffff;
}

/* متن لیست */
.task-content {
  text-align: right; /* متن راست چین */
}

</style>
