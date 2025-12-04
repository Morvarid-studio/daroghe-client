<script setup lang="ts">
import CrmCustomerRatings from '@/views/dashboards/crm/CrmCustomerRatings.vue'
import CrmCustomerTable from '@/views/dashboards/crm/CrmCustomerTable.vue'
import CrmEarningReport from '@/views/dashboards/crm/CrmEarningReport.vue'
import CrmGeneratedLeads from '@/views/dashboards/crm/CrmGeneratedLeads.vue'
import CrmSalesActivity from '@/views/dashboards/crm/CrmSalesActivity.vue'
import CrmSalesAnalytics from '@/views/dashboards/crm/CrmSalesAnalytics.vue'
import CrmSalesStats from '@/views/dashboards/crm/CrmSalesStats.vue'
import CrmSession from '@/views/dashboards/crm/CrmSessions.vue'
import CrmTeamMembers from '@/views/dashboards/crm/CrmTeamMembers.vue'
import CrmTopProducts from '@/views/dashboards/crm/CrmTopProducts.vue'

definePage({
  meta: {
    layout: 'default',
    requiresAuth: true,
  },
})
</script>

<template>
  <VRow class="match-height">
    <VCol
      cols="12"
      lg="8"
    >
      <CrmSalesAnalytics />
    </VCol>

    <VCol
      cols="12"
      lg="4"
    >
      <CrmCustomerRatings />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmSalesStats />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmSalesActivity />
    </VCol>

    <VCol
      cols="12"
      lg="4"
    >
      <CrmGeneratedLeads />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmEarningReport />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmSession />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmTopProducts />
    </VCol>

    <VCol
      cols="12"
      md="6"
      lg="4"
    >
      <CrmTeamMembers />
    </VCol>

    <VCol cols="12">
      <CrmCustomerTable />
    </VCol>
  </VRow>
</template>



