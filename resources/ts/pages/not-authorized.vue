<script setup lang="ts">
import notAuthorizedIllustration from '@images/pages/daroghe.png'

definePage({
  alias: '/pages/misc/not-authorized',
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="401"
      title="کی هستی شما"
      description="برو بچه جون، شما اجازه ورود به اینجا رو نداری"
    />

    <VBtn
      class="mb-6"
      to="/"
    >
      Back To Home
    </VBtn>

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="notAuthorizedIllustration"
        alt="Coming Soon"
        :max-width="500"
        class="mx-auto"
      />
    </div>
  </div>
</template>

<style lang="scss">
@use "@core-scss/template/pages/misc.scss";
</style>
