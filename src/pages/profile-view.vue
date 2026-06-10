<script setup lang="ts">
  import { useToast } from '@nuxt/ui/composables/useToast';
  import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
  import { reactive } from 'vue';
  import * as z from 'zod';

  const schema = z.object({
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
    nickname: '',
    githubUsername: '',
    email: '',
    tags: [],
    linkedin: '',
    homepage: '',
    blog: '',
  });

  const toast = useToast();
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log(event.data);
    toast.add({
      title: 'asdf',
    });
  }
</script>

<template>
  <div>
    <UForm class="space-y-6" :state="state" @submit="onSubmit">
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
          class="w-full"
          :items="[]"
          :model-value="undefined"
          placeholder="태그를 선택하세요"
          :ui="{
            base: 'h-12 bg-input outline-none px-0 ring-border transition-colors font-semibold text-base sm:text-base lg:text-base',
          }"
          @update:model-value="
            (val) => {
              if (val) state.tags.push(val);
            }
          "
        >
          <UInputTags
            v-model="state.tags"
            class="w-full border-none ring-0"
            :ui="{
              base: 'h-12 bg-trasparent outline-none has-focus-visible:ring-0 transition-colors font-semibold text-base sm:text-base lg:text-base',
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
    </UForm>
  </div>
</template>
