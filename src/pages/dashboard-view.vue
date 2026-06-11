<script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { onMounted } from 'vue';

  import { useProfileStore } from '@/features/profile/profile.store';
  import { useToolListStore } from '@/features/tool/tools.store';

  const toolListStore = useToolListStore();
  const { toolList, isLoading, err } = storeToRefs(toolListStore);
  const { fetchToolList } = toolListStore;

  const profileStore = useProfileStore();
  const { profile } = storeToRefs(profileStore);
  const { fetchProfile } = profileStore;

  onMounted(async () => {
    await fetchToolList();
    await fetchProfile();
  });
</script>

<template>
  <div class="mx-auto my-10 max-w-5xl space-y-10">
    <div class="flex w-full flex-row items-center justify-between">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {{ profile !== null ? `안녕하세요, ${profile!.name}님` : 'Team Tools' }}
        </h1>
        <p className="text-muted-foreground">
          Croffle Dev의 모든 업무 도구에 한 곳에서 접근하세요.
        </p>
      </div>
      <UButton class="h-10 px-6" to="/contacts">
        {{ '문의 처리' }}
      </UButton>
    </div>
    <UAlert
      v-if="!profile"
      title="프로필이 설정되지 않았습니다."
      description="메인 홈페이지에 게시될 프로필을 설정하세요"
      class="bg-primary/10 ring-0 outline-2 outline-dashed"
      variant="outline"
      icon="i-lucide-circle-user-round"
      orientation="horizontal"
      :actions="[
        {
          label: '프로필 추가하기',
          icon: 'i-lucide-plus',
          to: '/profile',
        },
      ]"
      :ui="{
        icon: 'size-12 my-auto bg-primary/10 p-2.5 rounded-full',
        title: 'text-foreground text-base',
        description: 'text-muted-foreground text-sm',
        actions: '[&>a]:text-sm [&>a]:px-4 [&>a]:py-2 [&>a]:rounded-xl',
      }"
    />
    <!-- HACK: tailwind의 동적 색상 적용을 위해 미리 정의 -->
    <div class="hidden">
      <div class="bg-white" />
      <div class="bg-rose-400" />
      <div class="bg-emerald-400" />
      <div class="bg-cyan-400" />
      <div class="bg-blue-500" />
      <div class="bg-indigo-400" />
    </div>
    <div v-if="isLoading">로딩중..</div>
    <div v-else-if="err">에러발생 {{ err }}</div>
    <UContainer v-else class="grid gap-6 px-0 sm:px-0 md:grid-cols-3 md:px-0 lg:px-0 xl:gap-8">
      <ULink
        v-for="tool in toolList"
        :key="tool.id"
        :to="tool.url"
        target="_blank"
        class="group rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      >
        <UCard
          class="ring-foreground/20 bg-primary/5 group-hover:bg-primary/10 h-full"
          :ui="{
            header: 'border-b-0 pb-2',
            body: 'pt-0 sm:pt-0',
          }"
        >
          <template #header>
            <div class="inline-flex w-full flex-row items-center justify-between">
              <div
                class="size-14 rounded-2xl p-3.5"
                :style="{
                  backgroundColor: `color-mix(in srgb, var(--color-${tool.color}) 15%, transparent)`,
                }"
              >
                <UIcon
                  :name="tool.icon_name"
                  class="size-7 rounded-2xl"
                  :style="{ color: `var(--color-${tool.color})` }"
                />
              </div>
              <UIcon
                name="i-lucide-square-arrow-out-up-right"
                class="hidden size-6 group-hover:block"
              />
            </div>
          </template>
          <div class="space-y-2">
            <h4 class="text-foreground text-2xl font-semibold">
              {{ tool.title }}
            </h4>
            <p class="text-muted-foreground text-base">
              {{ tool.description }}
            </p>
          </div>
        </UCard>
      </ULink>
    </UContainer>
  </div>
</template>
