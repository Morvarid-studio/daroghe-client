<script setup lang="ts">
  import { ref } from "vue";
import ApexChart from "vue3-apexcharts";
  
  /* ================== Weekly ================== */
  const weeklySeries = ref([
    {
      name: "فعالیت هفتگی",
      data: Array.from({ length: 7 }, () =>
        +(Math.random() * 8).toFixed(1)
      ),
    },
  ]);
  
  const weeklyOptions = ref({
    chart: {
      type: "bar",
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    colors: ["#7367F0"],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 10,
        barHeight: "38%", // فاصله بهتر
      },
    },
    grid: {
      borderColor: "#44446a",
      xaxis: { lines: { show: false } },
      padding: {
        left: 25, // ⭐ فاصله بین لیبل و نمودار
      },
    },
    xaxis: {
      categories: [
        "شنبه",
        "یک‌شنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنج‌شنبه",
        "جمعه",
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#ffffff",
          fontSize: "0.85rem",
          fontFamily: "BNazanin, Tahoma",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#ffffff",
          fontSize: "0.9rem",
          fontFamily: "BNazanin, Tahoma",
        },
      },
    },
  });
  
  /* ================== Monthly ================== */
  const monthlySeries = ref([
    {
      name: "فعالیت ماهانه",
      data: Array.from({ length: 12 }, () =>
        +(Math.random() * 160).toFixed(0)
      ),
    },
  ]);
  
  const monthlyOptions = ref({
    chart: {
      type: "bar",
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    colors: ["#7367F0"],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 10,
        barHeight: "38%",
      },
    },
    grid: {
      borderColor: "#44446a",
      xaxis: { lines: { show: false } },
      padding: {
        left: 25, // ⭐ فاصله امن
      },
    },
    xaxis: {
      categories: [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند",
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#ffffff",
          fontSize: "0.85rem",
          fontFamily: "BNazanin, Tahoma",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#ffffff",
          fontSize: "0.9rem",
          fontFamily: "BNazanin, Tahoma",
        },
      },
    },
  });
  </script>
  
  <template>
    <div class="charts-wrapper">
      <div class="chart-card">
        <h2>فعالیت هفتگی</h2>
        <ApexChart
          type="bar"
          height="320"
          :options="weeklyOptions"
          :series="weeklySeries"
        />
      </div>
  
      <div class="chart-card">
        <h2>فعالیت ماهانه</h2>
        <ApexChart
          type="bar"
          height="450"
          :options="monthlyOptions"
          :series="monthlySeries"
        />
      </div>
    </div>
  </template>
  
  <style scoped>
  .charts-wrapper {
    display: flex;
    flex-wrap: wrap;
    font-family: BNazanin, Tahoma, sans-serif;
    gap: 20px;
  }

  .chart-card {
    display: flex;
    flex: 1 1 45%;
    flex-direction: column;
    padding: 20px;
    border-radius: 14px;
    background-color: #2b2b40;
    box-shadow: 0 6px 14px rgba(115, 103, 240, 35%);
    color: white;
    min-inline-size: 350px;
    text-align: end;
  }

  .chart-card h2 {
    color: #fff;
    font-size: 1.25rem;
    margin-block-end: 15px;
  }

  @media (max-width: 768px) {
    .chart-card {
      flex: 1 1 100%;
    }
  }
  </style>
  