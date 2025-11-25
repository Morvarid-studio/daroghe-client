<script setup lang="ts">
import { h } from 'vue'
import api from '@/plugins/axios'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
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
  email: '',
  password: '',
  confirm_password: '',
  // privacyPolicies: false,
})

const isPasswordVisible = ref(false)
const isConfirmedPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const register = async () => {

  if (!form.value.user_name || !form.value.email || !form.value.password) {
    errorMessage.value = 'لطفا همه فیلدها را پر کنید.'
    return
  }

  if (form.value.password !== form.value.confirm_password) {
    errorMessage.value = 'رمز عبور و تکرار آن یکسان نیست.'
    return
  }

  // if (!form.value.privacyPolicies) {
  //   errorMessage.value = 'برای ثبت‌نام باید قوانین را بپذیرید.'
  //   return
  // }

  try {
    isLoading.value = true
    errorMessage.value = ''
    const res = await api.post('/api/register', {
      user_name: form.value.user_name,
      email: form.value.email,
      password: form.value.password,
      confirm_password: form.value.confirm_password,
    })


    console.log('REGISTER SUCCESS:', res.data)

    const token = res.data.token
    const user = res.data.user

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    // router.push('/dashboard')

  } catch (error: any) {
    console.error('REGISTER ERROR:', error.response?.data || error)
    errorMessage.value =
      error.response?.data?.message || 'ثبت‌نام با خطا مواجه شد.'
  } finally {
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

      <!-- 👉 Auth card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
<!--                <VNodeRenderer :nodes="themeConfig.app.logo"/>-->
                <h1 class="app-logo-title">
<!--                  {{ themeConfig.app.title }}-->
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            {{$t('Adventure starts here ❤️')}}
          </h4>
<!--          <p class="mb-0">-->
<!--            Make your app management easy and fun!-->
<!--          </p>-->
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="register">
            <VRow>
              <!-- Username -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.user_name"
                  autofocus
                  :label="$t('Username')"
                  placeholder="Alireza Monfared"
                />
              </VCol>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :label="$t('Email')"
                  type="email"
                  placeholder="alireza.monfared0430@gmail.com"
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
              </VCol>

                <!--                <div class="d-flex align-center my-6">-->
                <!--                  <VCheckbox-->
                <!--                    id="privacy-policy"-->
                <!--                    v-model="form.privacyPolicies"-->
                <!--                    inline-->
                <!--                  />-->
                <!--                  <VLabel-->
                <!--                    for="privacy-policy"-->
                <!--                    style="opacity: 1"-->
                <!--                  >-->
                <!--                    <span class="me-1 text-high-emphasis">I agree to</span>-->
                <!--                    <a-->
                <!--                      href="javascript:void(0)"-->
                <!--                      class="text-primary"-->
                <!--                    >privacy policy & terms</a>-->
                <!--                  </VLabel>-->
                <!--                </div>-->

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.confirm_password"
                  :label="$t('Confirm Password')"
                  placeholder="············"
                  :type="isConfirmedPasswordVisible ? 'text' : 'password'"
                  autocomplete="confirm_password"
                  :append-inner-icon="isConfirmedPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isConfirmedPasswordVisible = !isConfirmedPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                >
                  {{ $t('Sign up') }}
                </VBtn>

              </VCol>


              <!-- login instead -->
              <VCol
                cols="12"
                class="text-center text-base"
              >
                <span>{{$t('Already have an account?')}}</span>
                <RouterLink
                  class="text-primary ms-1"
                  :to="{ name: 'login' }"
                >
                  {{$t('Sign in instead')}}
                </RouterLink>
              </VCol>

<!--              <VCol-->
<!--                cols="12"-->
<!--                class="d-flex align-center"-->
<!--              >-->
<!--                <VDivider/>-->
<!--                <span class="mx-4">or</span>-->
<!--                <VDivider/>-->
<!--              </VCol>-->

              <!-- auth providers -->
<!--              <VCol-->
<!--                cols="12"-->
<!--                class="text-center"-->
<!--              >-->
<!--                <AuthProvider/>-->
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
