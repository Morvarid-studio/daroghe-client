<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const router = useRouter()
const ability = useAbility()

// TODO: Get type from backend
// بررسی هر دو cookie: user و userData (برای سازگاری)
const userDataCookie = useCookie<any>('userData')
const userCookie = useCookie<any>('user')

// استفاده از userData یا user (هر کدام که وجود داشته باشد)
const userData = computed(() => userDataCookie.value || userCookie.value)

// بررسی وجود userData
const hasUserData = computed(() => !!userData.value)

const logout = async () => {
  // Remove "accessToken" from cookie
  useCookie('accessToken').value = null

  // Remove "userData" from cookie
  userDataCookie.value = null
  userCookie.value = null

  // Redirect to login page
  await router.push('/login')

  // ℹ️ We had to remove abilities in then block because if we don't nav menu items mutation is visible while redirecting user to login page
  // Remove "userAbilities" from cookie
  useCookie('userAbilityRules').value = null
  await router.push('/login')

  // ℹ️ We had to remove abilities in then block because if we don't nav menu items mutation is visible while redirecting user to login page
  // Remove "userAbilities" from cookie
  useCookie('userAbilityRules').value = null

  // Reset ability to initial ability
  ability.update([])
}

// فعلا لینک تنظیمات را حذف می‌کنیم چون route وجود ندارد
const userProfileList: any[] = []
</script>

<template>
  <VBadge
    v-if="hasUserData"
    dot
    bordered
    location="bottom right"
    offset-x="1"
    offset-y="2"
    color="success"
  >
    <VAvatar
      size="38"
      class="cursor-pointer"
      :color="!(userData?.avatar) ? 'primary' : undefined"
      :variant="!(userData?.avatar) ? 'tonal' : undefined"
    >
      <VImg
        v-if="userData?.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="bx-user"
      />

      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="20px"
      >

    <!-- SECTION Menu -->
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VListItemAction>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                  bordered
                >
                  <VAvatar
                    :color="
                      !(userData?.avatar) ? 'primary' : undefined
                    "
                    :variant="
                      !(userData?.avatar) ? 'tonal' : undefined
                    "
                  >
                    <VImg
                      v-if="userData?.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="bx-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
              <div>
                <VListItemTitle class="font-weight-medium">
                  {{ userData?.fullName || userData?.username || userData?.user_name || 'کاربر' }}
                </VListItemTitle>
                <VListItemSubtitle class="text-disabled text-capitalize">
                  {{ userData?.role || 'کاربر' }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    rounded
                    class="me-3"
                    v-bind="item.badgeProps"
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-1"
              />
            </template>
            <VDivider class="my-1" />
            <VListItem
              prepend-icon="bx-power-off"
              @click="logout"
            >
              خروج از حساب
            </VListItem>
          </PerfectScrollbar>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
</template>
