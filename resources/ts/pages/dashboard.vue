<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { hexToRgb } from '@core/utils/colorConverter'
import api from '@/lib/axios'
import illustrationJohn from '@images/illustrations/illustration-john.png'
import moment from 'jalali-moment'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})

const router = useRouter()
const vuetifyTheme = useTheme()

// داده‌های نمودار
const dailyWorkHours = ref<any[]>([])
const isLoadingChart = ref(false)

// تبدیل تاریخ میلادی به شمسی (برای موارد خاص)
const formatToJalali = (dateString: string) => {
  if (!dateString) return ''
  try {
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

// دریافت نام روز شمسی از تاریخ شمسی
const getDayNameFromShamsi = (shamsiDate: string) => {
  if (!shamsiDate) return ''
  try {
    // تبدیل تاریخ شمسی به میلادی برای محاسبه روز هفته
    const momentDate = moment(shamsiDate, 'jYYYY/jMM/jDD')
    if (!momentDate.isValid()) {
      return ''
    }
    
    // تبدیل به میلادی و گرفتن روز هفته
    const gregorianDate = momentDate.toDate()
    const dayIndex = gregorianDate.getDay()
    
    // تبدیل index روز میلادی به نام روز فارسی
    const persianDays = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
    // در JavaScript: 0=Sunday, 1=Monday, ... 6=Saturday
    // در تقویم شمسی: 0=شنبه, 1=یک‌شنبه, ... 6=جمعه
    const persianDayIndex = (dayIndex + 1) % 7
    
    return persianDays[persianDayIndex]
  }
  catch (error) {
    console.error('Error getting day name from shamsi date:', error)
    return ''
  }
}

// محاسبه 7 روز اخیر و گروه‌بندی داده‌ها (با تاریخ شمسی)
const calculateLastSevenDays = (worklogs: any[]) => {
  console.log('=== calculateLastSevenDays START ===')
  console.log('Input worklogs:', worklogs)
  console.log('Worklogs count:', worklogs.length)
  
  // گرفتن تاریخ امروز به صورت شمسی
  const todayShamsi = moment().format('jYYYY/jMM/jDD')
  const todayMoment = moment(todayShamsi, 'jYYYY/jMM/jDD')

  console.log('Today (Shamsi):', todayShamsi)

  // ایجاد ساختار برای 7 روز اخیر (شمسی)
  const daysMap: Record<string, { date: string; shamsi_date: string; day_name: string; total_hours: number }> = {}
  
  for (let i = 6; i >= 0; i--) {
    // محاسبه تاریخ i روز قبل (از 6 روز قبل تا امروز)
    const targetMoment = moment(todayMoment).subtract(i, 'days')
    const shamsiDate = targetMoment.format('jYYYY/jMM/jDD')
    const dayName = getDayNameFromShamsi(shamsiDate)
    
    daysMap[shamsiDate] = {
      date: shamsiDate, // استفاده از تاریخ شمسی به عنوان key
      shamsi_date: shamsiDate,
      day_name: dayName,
      total_hours: 0,
    }
    
    console.log(`Day ${i}: ${shamsiDate} -> ${dayName}`)
  }

  console.log('Days map keys (Shamsi):', Object.keys(daysMap))

  // جمع‌آوری ساعات کاری (work_date از سرور شمسی هست)
  worklogs.forEach((log) => {
    // فرمت کردن work_date برای اطمینان از فرمت یکسان
    let workDate = log.work_date || ''
    
    // اگر تاریخ به صورت ISO 8601 هست، فقط قسمت تاریخ رو بگیر
    if (workDate.includes('T')) {
      const datePart = workDate.split('T')[0]
      // اگر سال شمسی هست (مثلاً 1404-09-11)، به فرمت Y/m/d تبدیل می‌کنیم
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        workDate = datePart.replace(/-/g, '/')
      } else {
        workDate = datePart
      }
    } else if (workDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // اگر به فرمت Y-m-d هست، به Y/m/d تبدیل می‌کنیم
      workDate = workDate.replace(/-/g, '/')
    }
    
    console.log('Processing log:', {
      original_work_date: log.work_date,
      formatted_work_date: workDate,
      work_hours: log.work_hours,
      existsInMap: workDate && daysMap[workDate] ? 'YES' : 'NO',
    })
    
    if (workDate && daysMap[workDate]) {
      const hours = parseFloat(log.work_hours) || 0
      daysMap[workDate].total_hours += hours
      console.log(`Added ${hours} hours to ${workDate}. New total: ${daysMap[workDate].total_hours}`)
    } else if (workDate) {
      console.warn(`Date ${workDate} not found in daysMap!`)
    }
  })

  // تبدیل به آرایه و مرتب‌سازی بر اساس تاریخ شمسی
  const result = Object.values(daysMap).sort((a, b) => {
    // مقایسه تاریخ‌های شمسی
    const momentA = moment(a.shamsi_date, 'jYYYY/jMM/jDD')
    const momentB = moment(b.shamsi_date, 'jYYYY/jMM/jDD')
    return momentA.diff(momentB)
  })
  
  console.log('Final result:', result)
  console.log('=== calculateLastSevenDays END ===')
  
  return result
}

// دریافت داده‌های worklogs و محاسبه
const fetchWorklogs = async () => {
  console.log('=== fetchWorklogs START ===')
  isLoadingChart.value = true
  try {
    console.log('Fetching from /api/worklogs...')
    const response = await api.get('/api/worklogs')
    console.log('API Response:', response)
    console.log('Response data:', response.data)
    console.log('Response data type:', typeof response.data)
    console.log('Is array?', Array.isArray(response.data))
    
    const worklogs = response.data || []
    console.log('Worklogs after processing:', worklogs)
    console.log('Worklogs length:', worklogs.length)
    
    if (worklogs.length > 0) {
      console.log('First worklog sample:', worklogs[0])
      console.log('First worklog work_date:', worklogs[0].work_date)
      console.log('First worklog work_hours:', worklogs[0].work_hours)
    }
    
    // محاسبه 7 روز اخیر
    const calculated = calculateLastSevenDays(worklogs)
    console.log('Calculated daily work hours:', calculated)
    console.log('Calculated length:', calculated.length)
    
    dailyWorkHours.value = calculated
    console.log('dailyWorkHours.value set to:', dailyWorkHours.value)
  }
  catch (error: any) {
    console.error('=== ERROR in fetchWorklogs ===')
    console.error('Error object:', error)
    console.error('Error message:', error.message)
    console.error('Error response:', error.response)
    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
    }
    dailyWorkHours.value = []
  }
  finally {
    isLoadingChart.value = false
    console.log('=== fetchWorklogs END ===')
  }
}

// محاسبه مجموع ساعات امروز
const todayWorkHours = computed(() => {
  if (!dailyWorkHours.value || dailyWorkHours.value.length === 0) return 0
  
  // آخرین روز (امروز) را پیدا می‌کنیم
  const today = dailyWorkHours.value[dailyWorkHours.value.length - 1]
  return today?.total_hours || 0
})

// محاسبه مجموع ساعات هفته
const weekTotalHours = computed(() => {
  if (!dailyWorkHours.value || dailyWorkHours.value.length === 0) return 0
  return dailyWorkHours.value.reduce((sum, day) => sum + (day.total_hours || 0), 0)
})

// فرمت عدد برای نمایش
const formatHoursNumber = (hours: number) => {
  if (hours === 0) return '0'
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}د`
  }
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) {
    return `${h}س`
  }
  return `${h}.${Math.round(m / 6)}س`
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

// تنظیمات نمودار خطی (برای کارت Total Balance)
const lineChartSeries = computed(() => {
  const data = dailyWorkHours.value.map(day => parseFloat((day.total_hours || 0).toFixed(2)))
  console.log('lineChartSeries computed - dailyWorkHours.value:', dailyWorkHours.value)
  console.log('lineChartSeries computed - data:', data)
  
  return [
    {
      name: 'ساعات کاری',
      data: data,
    },
  ]
})

const lineChartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors
  const variableTheme = vuetifyTheme.current.value.variables
  const disabledTextColor = `rgba(${hexToRgb(String(currentTheme['on-surface']))},${variableTheme['disabled-opacity']})`
  // استفاده از نام روز برای نمایش در محور X
  const categories = dailyWorkHours.value.map(day => day.day_name || '')
  const dataLength = lineChartSeries.value[0]?.data?.length || 0
  
  return {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      dropShadow: {
        top: 15,
        blur: 5,
        left: 0,
        opacity: 0.1,
        enabled: true,
        color: currentTheme.primary,
      },
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        top: -20,
        bottom: 3,
      },
    },
    legend: { show: false },
    colors: [`rgba(${hexToRgb(String(currentTheme.primary))}, 1)`],
    markers: {
      size: 8,
      strokeWidth: 6,
      strokeOpacity: 1,
      hover: { size: 8 },
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: dataLength > 0 ? [
        {
          size: 8,
          seriesIndex: 0,
          fillColor: '#fff',
          strokeColor: currentTheme.primary,
          dataPointIndex: dataLength - 1,
        },
      ] : [],
    },
    stroke: {
      width: 4,
      curve: 'smooth',
      lineCap: 'round',
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: categories,
      labels: {
        style: {
          fontSize: '13px',
          colors: disabledTextColor,
          fontFamily: 'IRANSansX, BNazanin, Tahoma, sans-serif',
        },
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '13px',
          fontFamily: 'IRANSansX, BNazanin, Tahoma, sans-serif',
        },
      },
    },
    yaxis: {
      labels: { show: false },
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '13px',
        fontFamily: 'IRANSansX, BNazanin, Tahoma, sans-serif',
      },
      y: {
        formatter: (val: number) => formatWorkHours(val),
      },
    },
  }
})


onMounted(() => {
  fetchWorklogs()
})
</script>

<template>
  <VRow>
    <!-- کارت تبریک/انگیزشی -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard class="text-center text-sm-start">
        <VRow no-gutters>
          <VCol
            cols="12"
            sm="8"
            order="2"
            order-sm="1"
          >
            <VCardItem class="pb-3">
              <VCardTitle class="text-primary">
                امروز چقدر کار کردی؟
              </VCardTitle>
            </VCardItem>

            <VCardText>
              <div class="mb-2">
                برای دریافت جیره و مواجب میزان کار خود را وارد کنید
              </div>
              <VBtn
                color="primary"
                variant="elevated"
                class="mt-4"
                @click="router.push('/work-hours/add')"
              >
                ثبت ساعات کاری
              </VBtn>
            </VCardText>
          </VCol>

          <VCol
            cols="12"
            sm="4"
            order="1"
            order-sm="2"
            class="text-center"
          >
            <img
              :src="illustrationJohn"
              :height="$vuetify.display.xs ? '150' : '182'"
              :class="$vuetify.display.xs ? 'mt-6 mb-n2' : 'position-absolute'"
              class="john-illustration flip-in-rtl"
              alt="کارگر"
            >
          </VCol>
        </VRow>
      </VCard>

      <!-- کارت‌های KPI: مانده تنخواه و حقوق ماه -->
      <VRow class="mt-4">
        <!-- مانده تنخواه -->
        <VCol
          cols="12"
          sm="6"
        >
          <VCard>
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-4">
                <VAvatar
                  icon="bx-wallet"
                  color="success"
                  size="48"
                  rounded
                  variant="tonal"
                />
                <MoreBtn />
              </div>
              <div class="text-base text-medium-emphasis mb-1">
                مانده تنخواه
              </div>
              <h4 class="text-h4 mb-3">
                12,628,000
              </h4>
              <div class="d-flex align-center gap-2">
                <VIcon
                  size="20"
                  icon="bx-chevron-up"
                  color="success"
                />
                <span class="text-sm text-success font-weight-medium">
                  72.8%
                </span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- حقوق ماه -->
        <VCol
          cols="12"
          sm="6"
        >
          <VCard>
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-4">
                <VAvatar
                  icon="bx-money"
                  color="primary"
                  size="48"
                  rounded
                  variant="tonal"
                />
                <MoreBtn />
              </div>
              <div class="text-base text-medium-emphasis mb-1">
                حقوق ماه
              </div>
              <h4 class="text-h4 mb-3">
                4,679,000
              </h4>
              <div class="d-flex align-center gap-2">
                <VIcon
                  size="20"
                  icon="bx-chevron-up"
                  color="success"
                />
                <span class="text-sm text-success font-weight-medium">
                  28.42%
                </span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCol>

    <!-- کارت Total Balance برای ساعات کاری -->
    <VCol
      cols="12"
      md="6"
    >
      <VCard title="مجموع ساعات کاری">
        <VCardText class="pb-2">
          <div class="d-flex align-center flex-wrap gap-x-14 mb-8">
            <div class="d-flex align-center gap-3">
              <VAvatar
                icon="bx-time"
                color="primary"
                size="40"
                rounded
                variant="tonal"
              />
              <div>
                <h6 class="text-h6">
                  {{ formatHoursNumber(todayWorkHours) }}
                </h6>
                <span class="text-base d-inline-block">امروز</span>
              </div>
            </div>
            <div class="d-flex align-center gap-3">
              <VAvatar
                icon="bx-calendar-week"
                color="success"
                size="40"
                rounded
                variant="tonal"
              />
              <div>
                <h6 class="text-h6">
                  {{ formatHoursNumber(weekTotalHours) }}
                </h6>
                <span class="text-base d-inline-block">هفته</span>
              </div>
            </div>
          </div>

          <div
            v-if="isLoadingChart"
            class="text-center py-8"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              size="32"
            />
          </div>

          <template v-else>
            <VueApexCharts
              v-if="dailyWorkHours.length > 0 && lineChartSeries[0]?.data?.length > 0"
              type="line"
              :height="217"
              :options="lineChartOptions"
              :series="lineChartSeries"
            />

            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                size="48"
                icon="bx-line-chart"
                class="text-medium-emphasis mb-2"
              />
              <p class="text-body-2 text-medium-emphasis">
                داده‌ای برای نمایش وجود ندارد
              </p>
            </div>
          </template>
        </VCardText>
      </VCard>
    </VCol>

  </VRow>
</template>

<style lang="scss" scoped>
.john-illustration {
  inset-block-end: -0.125rem;
  inset-inline-end: 3.5rem;
}

// استایل برای tooltip نمودار
:deep(.apexcharts-tooltip) {
  font-family: 'IRANSansX', 'BNazanin', 'Tahoma', sans-serif !important;
  
  .apexcharts-tooltip-title {
    font-family: 'IRANSansX', 'BNazanin', 'Tahoma', sans-serif !important;
  }
  
  .apexcharts-tooltip-series-group {
    font-family: 'IRANSansX', 'BNazanin', 'Tahoma', sans-serif !important;
  }
}

// استایل برای xaxis tooltip (بخش پایینی که روز رو نشون میده)
:deep(.apexcharts-xaxistooltip) {
  font-family: 'IRANSansX', 'BNazanin', 'Tahoma', sans-serif !important;
  
  .apexcharts-xaxistooltip-text {
    font-family: 'IRANSansX', 'BNazanin', 'Tahoma', sans-serif !important;
  }
}
</style>
