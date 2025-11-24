<script setup lang="ts">
import { ref } from "vue";
import ApexChart from "vue3-apexcharts";

// داده رندوم هفتگی
const weeklySeries = ref([
  { name: "فعالیت هفتگی", data: Array.from({ length: 7 }, () => +(Math.random() * 8).toFixed(2)) },
]);

const weeklyOptions = ref({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  colors: ['#7367F0'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 8, barHeight: '30%', horizontal: true } },
  grid: { borderColor: '#44446a', xaxis: { lines: { show: false } }, padding: { top: -10 } },
  yaxis: { labels: { style: { colors: '#ffffff', fontSize: '0.85rem', fontFamily: 'BNazanin, Tahoma' } } },
  xaxis: { axisBorder: { show: false }, axisTicks: { color: '#44446a' },
    categories: ['شنبه','یک‌شنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه'],
    labels: { style: { colors: '#ffffff', fontSize: '0.85rem', fontFamily: 'BNazanin, Tahoma' } }
  },
});

// داده رندوم ماهانه
const monthlySeries = ref([
  { name: "فعالیت ماهانه", data: Array.from({ length: 12 }, () => +(Math.random() * 160).toFixed(2)) },
]);

const monthlyOptions = ref({
  chart: { parentHeightOffset: 0, toolbar: { show: false } },
  colors: ['#7367F0'],
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 8, barHeight: '30%', horizontal: true } },
  grid: { borderColor: '#44446a', xaxis: { lines: { show: false } }, padding: { top: -10 } },
  yaxis: { labels: { style: { colors: '#ffffff', fontSize: '0.85rem', fontFamily: 'BNazanin, Tahoma' } } },
  xaxis: { axisBorder: { show: false }, axisTicks: { color: '#44446a' },
    categories: ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"],
    labels: { style: { colors: '#ffffff', fontSize: '0.85rem', fontFamily: 'BNazanin, Tahoma' } }
  },
});
</script>

<template>
  <div class="charts-wrapper">
    <div class="chart-card">
      <h2>فعالیت هفتگی</h2>
      <ApexChart :options="weeklyOptions" :series="weeklySeries" type="bar" height="350"/>
    </div>

    <div class="chart-card">
      <h2>فعالیت ماهانه</h2>
      <ApexChart :options="monthlyOptions" :series="monthlySeries" type="bar" height="450"/>
    </div>
  </div>
</template>

<style scoped>
.charts-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-family: 'BNazanin', Tahoma, sans-serif;
}

.chart-card {
  flex: 1 1 45%;
  min-width: 350px;
  background-color: #2b2b40;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(115, 103, 240, 0.4);
  color: #000000;
  display: flex;
  flex-direction: column;
  max-height: 500px; /* کنترل ارتفاع و اسکرول */
  overflow-y: auto;
  text-align: right;
}

.chart-card h2 {
  margin-bottom: 15px;
  font-size: 1.25rem;
  color: white;
  text-align: right;
}
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px; /* فاصله بین کارت‌ها */
  justify-content: flex-end; /* کارت‌ها سمت راست جمع شوند */
}

/* کارت‌ها */
.chart-box {
  width: 48%;
  min-width: 300px; /* حداقل عرض مناسب */
}

/* وقتی صفحه کوچک شد */
@media (max-width: 768px) {
  .chart-box {
    width: 100%; /* زیر هم قرار گرفتن */
    min-width: auto; /* حذف محدودیت */
  }
}

</style>
