<script setup lang="ts">
  import { useToast } from '@nuxt/ui/composables/useToast';
  import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
  import { storeToRefs } from 'pinia';
  import { computed, onMounted, reactive, watch } from 'vue';
  import * as z from 'zod';

  import { useProfileStore } from '@/features/profile/profile.store';
  import {
    TagValues,
    type SaveProfileRequest,
    type TagValue,
    type TagValueLabel,
  } from '@/features/profile/profile.type';

  const toast = useToast();

  const profileStore = useProfileStore();
  const { profile, err } = storeToRefs(profileStore);
  const { fetchProfile, saveProfile } = profileStore;

  const schema = z.object({
    name: z.string('Name is required').nonempty('Name is required'),
    nickname: z.string('Nickname is required').nonempty('Nickname is required'),
    githubUsername: z.string('Github username is required').nonempty('Github username is required'),
    email: z.email('Invalid email').nonempty('Email is required'),
    tags: z.array(z.string()),
    linkedin: z.url().optional(),
    homepage: z.url().optional(),
    blog: z.url().optional(),
  });
  type Schema = z.output<typeof schema>;

  const state = reactive<Schema>({
    name: '',
    nickname: '',
    githubUsername: '',
    email: '',
    tags: [],
    linkedin: '',
    homepage: '',
    blog: '',
  });

  const selectedTagItems = computed<TagValueLabel[]>({
    get: () => TagValues.filter((t) => state.tags.includes(t.value)),
    set: (items: TagValueLabel[]) => {
      state.tags = items.map((t) => t.value);
    },
  });
  const tagLabels = computed<string[], string[]>({
    get: () => state.tags.map((v) => TagValues.find((t) => t.value === v)?.label ?? v),
    set: (labels: string[]) => {
      state.tags = labels
        .map((l) => TagValues.find((t) => t.label === l)?.value)
        .filter((v): v is TagValue => v !== undefined);
    },
  });

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    const saveRequest: SaveProfileRequest = {
      name: event.data.name,
      nickname: event.data.nickname,
      github_username: event.data.githubUsername,
      email: event.data.email,
      tags: event.data.tags as TagValue[],
      linkedin: event.data.linkedin,
      homepage: event.data.homepage,
      blog: event.data.blog,
    };
    await saveProfile(saveRequest);

    if (!err.value) {
      toast.add({
        title: '성공',
        description: '프로필이 성공적으로 저장되었습니다.',
        color: 'success',
      });
    } else {
      toast.add({
        title: '에러',
        description: err.value,
        color: 'error',
      });
    }
  }

  onMounted(async () => {
    await fetchProfile();
  });

  watch(
    profile,
    (val) => {
      if (!val) return;
      state.name = val.name ?? '';
      state.nickname = val.nickname ?? '';
      state.githubUsername = val.github_username ?? '';
      state.email = val.email ?? '';
      state.tags = val.tags ?? [];
      state.linkedin = val.linkedin ?? '';
      state.homepage = val.homepage ?? '';
      state.blog = val.blog ?? '';
    },
    { immediate: true }, // 마운트 시점에도 즉시 실행
  );
</script>

<template>
  <UContainer class="mb-12 max-w-4xl space-y-6">
    <UPageHeader title="프로필 수정" :ui="{ title: 'text-2xl sm:text-3xl' }" />
    <UForm class="space-y-6" :state="state" @submit="onSubmit">
      <UFormField
        required
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-tag" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">이름</span>
        </template>
        <UInput
          v-model="state.name"
          type="text"
          class="w-full rounded-lg text-xl"
          placeholder="이름을 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        required
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-tag" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">닉네임</span>
        </template>
        <UInput
          v-model="state.nickname"
          type="text"
          class="w-full rounded-lg text-xl"
          placeholder="닉네임을 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        required
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-github" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">Github 계정명</span>
        </template>
        <UInput
          v-model="state.githubUsername"
          type="text"
          class="w-full rounded-lg text-xl"
          placeholder="Github 계정명을 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        required
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-mail" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">Email</span>
        </template>
        <UInput
          v-model="state.email"
          type="email"
          class="w-full rounded-lg text-xl"
          placeholder="Email을 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-tags" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">태그</span>
        </template>
        <USelectMenu
          v-model="selectedTagItems"
          class="w-full"
          :items="TagValues"
          multiple
          :ui="{
            base: 'h-auto bg-input outline-nonering-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
          @change="() => console.log(state.tags)"
        >
          <UInputTags
            v-model="tagLabels"
            class="w-full border-none ring-0"
            :placeholder="state.tags.length === 0 ? '태그를 선택하세요' : ''"
            :ui="{
              base: 'h-auto bg-trasparent outline-none has-focus-visible:ring-0 transition-colors font-semibold text-base sm:text-base lg:text-base',
              item: 'text-base',
            }"
          />
        </USelectMenu>
      </UFormField>
      <UFormField
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-linkedin" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">Linkedin</span>
        </template>
        <UInput
          v-model="state.linkedin"
          type="url"
          class="w-full rounded-lg text-xl"
          placeholder="Linkedin 주소를 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-home" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">개인 홈페이지</span>
        </template>
        <UInput
          v-model="state.homepage"
          type="url"
          class="w-full rounded-lg text-xl"
          placeholder="개인 홈페이지 주소를 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <UFormField
        :ui="{
          label: 'text-base mb-2 inline-flex items-center',
        }"
      >
        <template #label>
          <UIcon name="i-lucide-coffee" class="text-foreground mr-2 h-4 w-4" />
          <span class="text-base">블로그</span>
        </template>
        <UInput
          v-model="state.blog"
          type="url"
          class="w-full rounded-lg text-xl"
          placeholder="블로그 주소를 입력하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-4 py-3 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
        />
      </UFormField>
      <div class="mt-12 flex w-full gap-4">
        <UButton
          class="flex-1 items-center justify-center py-4 text-center text-base font-semibold"
          color="neutral"
          variant="outline"
          to="/"
        >
          {{ '취소' }}
        </UButton>
        <UButton
          class="flex-1 items-center justify-center py-4 text-center text-base font-semibold"
          color="primary"
          type="submit"
        >
          {{ '저장' }}
        </UButton>
      </div>
    </UForm>
  </UContainer>
</template>
