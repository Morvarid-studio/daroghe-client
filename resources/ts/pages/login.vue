<script setup lang="ts">
import api from '@/lib/axios'
import { useRouter } from 'vue-router'
import { ref, h } from 'vue'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const form = ref({
  user_name: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const login = async () =>{
  if(!form.value.user_name || !form.value.password){
    errorMessage.value = 'نام کاربری یا رمز عبور خود را وارد کنید'
    return
  }
  try{
    isLoading.value = true
    errorMessage.value = ''

    const res = await api.post('/api/login',{
      user_name: form.value.user_name,
      password: form.value.password,
      remember: form.value.remember,
    })

    console.log('LOGIN SUCCESS:', res.data)

    const token = res.data.token
    const user = res.data.user

    // ذخیره توکن و اطلاعات کاربر
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    // تنظیم کوکی برای گاردهای پروژه پیش‌فرض
    useCookie('accessToken').value = token
    useCookie('userData').value = user

    // رفتن به داشبورد
    router.push('/dashboard')
  }
  catch(error:any){
  console.log(error)
    errorMessage.value = error.response?.data?.message|| 'خطا در ورود'
  }
  finally {
    isLoading.value = false
  }

}

</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
<!--                <VNodeRenderer :nodes="themeConfig.app.logo" />-->
                <h1 class="app-logo-title">
<!--                  {{ themeConfig.app.title }}-->
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            {{$t('Welcome to')}}
<!--            <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻-->
          </h4>
<!--          <p class="mb-0">-->
<!--            Please sign-in to your account and start the adventure-->
<!--          </p>-->
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="login">
            <VRow>
              <!-- user_name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.user_name"
                  autofocus
                  :label="$t('Username')"
                  type="text"
                  placeholder="علیرضا منفرد"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :label="$t('Password')"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <!-- remember me checkbox -->
                <div class="d-flex align-center justify-space-between flex-wrap my-6">
                  <VCheckbox
                    v-model="form.remember"
                    :label="$t('Remember me')"
                  />

                  <RouterLink
                    class="text-primary"
                    :to="{ name: 'forgot-password' }"
                  >
                    {{$t('Forgot Password?')}}
                  </RouterLink>
                </div>

                <!-- login button -->
                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  {{$t('Login')}}
                </VBtn>
              </VCol>

              <!-- error message -->
              <VCol cols="12" v-if="errorMessage">
                <VAlert
                  type="error"
                  variant="tonal"
                  closable
                  @click:close="errorMessage = ''"
                >
                  {{ errorMessage }}
                </VAlert>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block"> {{$t('New on our platform?')}} </span>
                <RouterLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  :to="{ name: 'register' }"
                >
                  {{$t('Create an account')}}
                </RouterLink>
              </VCol>

<!--              <VCol-->
<!--                cols="12"-->
<!--                class="d-flex align-center"-->
<!--              >-->
<!--                <VDivider />-->
<!--                <span class="mx-4 text-high-emphasis">or</span>-->
<!--                <VDivider />-->
<!--              </VCol>-->

              <!-- auth providers -->
<!--              <VCol-->
<!--                cols="12"-->
<!--                class="text-center"-->
<!--              >-->
<!--                <AuthProvider />-->
<!--              </VCol>-->
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core-scss/template/pages/page-auth";
</style>
