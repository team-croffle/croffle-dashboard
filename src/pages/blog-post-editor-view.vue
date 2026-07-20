<script setup lang="ts">
  import { useColorMode } from '@vueuse/core';
  import {
    DropdownToolbar,
    MdEditor,
    type ExposeParam,
    type UploadImgCallBackParam,
  } from 'md-editor-v3';
  import 'md-editor-v3/lib/style.css';
  import { storeToRefs } from 'pinia';
  import { computed, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import ThumbnailLibraryModal from '@/features/blog/components/thumbnail-library-modal.vue';
  import { useBlogStore } from '@/features/blog/stores/blog.store';
  import { useCategoryStore } from '@/features/blog/stores/category.store';
  import { usePostStore } from '@/features/blog/stores/post.store';
  import { useSeriesStore } from '@/features/blog/stores/series.store';
  import { useTagStore } from '@/features/blog/stores/tag.store';
  import type { Category } from '@/features/blog/types/category.types';
  import type {
    PostSaveRequest,
    PostStatus,
    PostVisibility,
  } from '@/features/blog/types/post.types';
  import type { Series } from '@/features/blog/types/series.types';
  import type { Tag } from '@/features/blog/types/tag.types';

  const route = useRoute();
  const router = useRouter();
  const colorMode = useColorMode();

  const blogSlug = computed(() => route.params.blogSlug as string);
  const postIdx = computed(() => {
    const raw = route.params.postIdx;
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  });
  const isEditMode = computed(() => route.name === 'blog-post-edit');

  const blogStore = useBlogStore();
  const { getBlogBySlug } = blogStore;
  const currentBlog = computed(() => getBlogBySlug(blogSlug.value));

  const postStore = usePostStore();
  const { currentPost, isSaving, isUploading, err: postErr, isSaved } = storeToRefs(postStore);

  const categoryStore = useCategoryStore();

  const tagStore = useTagStore();
  const { tags } = storeToRefs(tagStore);

  const seriesStore = useSeriesStore();
  const { seriesList } = storeToRefs(seriesStore);

  // --- Form state ---
  const title = ref('');
  const content = ref('');
  const currentStatus = ref<PostStatus>('draft');
  const status = ref<PostStatus>('draft');
  const visibility = ref<PostVisibility>('public');
  const passwordHash = ref('');
  const thumbnailId = ref<string | null>(null);
  const thumbnailPreview = ref<string | null>(null);
  const selectedCategories = ref<string[]>([]);
  const selectedTags = ref<Tag[]>([]);
  const selectedSeriesId = ref<string | null>(null);
  const selectedSeries = computed<Series | null>(
    () => seriesList.value.find((s) => s.id === selectedSeriesId.value) ?? null,
  );

  // --- Inline creation state ---
  const newTagName = ref('');
  const newSeriesName = ref('');
  const isCreatingTag = ref(false);
  const isCreatingSeries = ref(false);

  const formState = reactive({
    title,
    content,
    status,
    visibility,
    passwordHash,
    selectedCategories,
    selectedTags,
    selectedSeriesId,
    newTagName,
    newSeriesName,
  });

  const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;

  function resetForm() {
    title.value = '';
    content.value = '';
    currentStatus.value = 'draft';
    status.value = 'draft';
    visibility.value = 'public';
    passwordHash.value = '';
    thumbnailId.value = null;
    thumbnailPreview.value = null;
    selectedCategories.value = [];
    selectedTags.value = [];
    selectedSeriesId.value = null;
    newTagName.value = '';
    newSeriesName.value = '';
    postStore.clearCurrentPost();
  }

  async function loadEditor() {
    if (!currentBlog.value) {
      router.replace({ name: 'blog-home' });
      return;
    }

    const blogId = currentBlog.value.id;

    // 새 글 저장 직후 edit URL로 replace된 경우, 이미 로드된 글이면 재fetch 생략
    if (
      isEditMode.value &&
      postIdx.value !== undefined &&
      currentPost.value?.postIdx === postIdx.value &&
      currentPost.value.blogId === blogId
    ) {
      return;
    }

    resetForm();

    await Promise.all([
      categoryStore.fetchCategories(blogId),
      tagStore.fetchTags(blogId),
      seriesStore.fetchSeries(blogId),
    ]);

    if (isEditMode.value && postIdx.value !== undefined) {
      await postStore.fetchPost(blogId, postIdx.value);
      if (!currentPost.value) {
        router.replace({
          name: 'blog-manage',
          params: { blogSlug: blogSlug.value },
          query: { section: 'posts' },
        });
        return;
      }

      const p = currentPost.value;
      title.value = p.title;
      content.value = p.content;
      currentStatus.value = p.status;
      status.value = p.status;
      visibility.value = p.visibility;
      thumbnailId.value = p.thumbnail;
      thumbnailPreview.value = p.thumbnail ? `${DIRECTUS_URL}/assets/${p.thumbnail}` : null;
      selectedCategories.value = p.categories.map((c) => c.id);
      selectedTags.value = [...p.tags];
      selectedSeriesId.value = p.series[0]?.id ?? null;
    }
  }

  watch(
    [blogSlug, postIdx, () => route.name],
    () => {
      void loadEditor();
    },
    { immediate: true },
  );

  // --- Thumbnail ---
  const showLibrary = ref(false);

  async function handleThumbnailChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = await postStore.uploadThumbnail(file, blogSlug.value);
    if (id) {
      thumbnailId.value = id;
      thumbnailPreview.value = `${DIRECTUS_URL}/assets/${id}`;
    }
  }

  function selectLibraryThumbnail(fileId: string) {
    thumbnailId.value = fileId;
    thumbnailPreview.value = `${DIRECTUS_URL}/assets/${fileId}`;
  }

  function removeThumbnail() {
    thumbnailId.value = null;
    thumbnailPreview.value = null;
  }

  // --- Tags ---
  function toggleTag(tag: Tag) {
    const idx = selectedTags.value.findIndex((t) => t.id === tag.id);
    if (idx === -1) selectedTags.value.push(tag);
    else selectedTags.value.splice(idx, 1);
  }

  function isTagSelected(tagId: string) {
    return selectedTags.value.some((t) => t.id === tagId);
  }

  async function createAndAddTag() {
    if (!newTagName.value.trim() || !currentBlog.value) return;
    isCreatingTag.value = true;
    const created = await tagStore.createTag({
      blogId: currentBlog.value.id,
      name: newTagName.value.trim(),
    });
    if (created) {
      selectedTags.value.push(created);
      newTagName.value = '';
    }
    isCreatingTag.value = false;
  }

  // --- Series ---
  async function createAndSelectSeries() {
    if (!newSeriesName.value.trim() || !currentBlog.value) return;
    isCreatingSeries.value = true;
    const created = await seriesStore.createSeries({
      blogId: currentBlog.value.id,
      name: newSeriesName.value.trim(),
    });
    if (created) {
      selectedSeriesId.value = created.id;
      newSeriesName.value = '';
    }
    isCreatingSeries.value = false;
  }

  // --- Save ---
  function sameIds(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    const set = new Set(b);
    return a.every((id) => set.has(id));
  }

  function buildPayload(overrideStatus?: PostStatus): Partial<PostSaveRequest> {
    const p = currentPost.value;

    // 지금글의 내용 없음 === 새 글
    if (!p) {
      return {
        title: title.value,
        content: content.value,
        status: overrideStatus ?? status.value,
        visibility: visibility.value,
        thumbnail: thumbnailId.value,
        // passwordHash: visibility.value === 'protected' ? passwordHash.value : null, // TODO: 비밀번호 해시 기능은 개발 중
        categories: selectedCategories.value.map((id) => ({ categories_id: id })),
        tags: selectedTags.value.map((t) => ({ tags_id: t.id })),
        series: selectedSeries.value ? [{ series_id: selectedSeries.value.id }] : [],
      };
    }

    // 변경된 내용만 저장
    const payload: Partial<PostSaveRequest> = {};

    if (title.value !== p.title) payload.title = title.value;
    if (content.value !== p.content) payload.content = content.value;
    if (overrideStatus !== undefined && overrideStatus !== p.status) {
      payload.status = overrideStatus;
    }
    if (visibility.value !== p.visibility) payload.visibility = visibility.value;
    if (thumbnailId.value !== p.thumbnail) payload.thumbnail = thumbnailId.value;

    const nextCategoryIds = selectedCategories.value;
    const prevCategoryIds = p.categories.map((c) => c.id);
    if (!sameIds(nextCategoryIds, prevCategoryIds)) {
      payload.categories = nextCategoryIds.map((id) => ({ categories_id: id }));
    }

    const nextTagIds = selectedTags.value.map((t) => t.id);
    const prevTagIds = p.tags.map((t) => t.id);
    if (!sameIds(nextTagIds, prevTagIds)) {
      payload.tags = selectedTags.value.map((t) => ({ tags_id: t.id }));
    }

    const nextSeriesId = selectedSeries.value?.id ?? null;
    const prevSeriesId = p.series[0]?.id ?? null;
    if (nextSeriesId !== prevSeriesId) {
      payload.series = nextSeriesId ? [{ series_id: nextSeriesId }] : [];
    }

    return payload;
  }

  async function save(overrideStatus?: PostStatus) {
    if (!title.value.trim() || !currentBlog.value) return;

    if (isEditMode.value && !currentPost.value) return;

    const payload = buildPayload(overrideStatus);

    if (currentPost.value) {
      await postStore.updatePost(currentPost.value.id, payload);
      if (payload.status) {
        currentStatus.value = payload.status;
        status.value = payload.status;
      }
    } else {
      const created = await postStore.createPost(currentBlog.value.id, payload);
      if (created) {
        currentStatus.value = created.status;
        status.value = created.status;
        router.replace({
          name: 'blog-post-edit',
          params: { blogSlug: blogSlug.value, postIdx: created.postIdx },
        });
      }
    }
  }

  async function publish() {
    if (currentStatus.value === 'published') {
      await save();
    } else {
      await save('published');
    }
  }

  // --- Category tree flatten helper ---
  function flattenCategories(cats: Category[], depth = 0): Array<Category & { depth: number }> {
    return cats.flatMap((cat) => [
      { ...cat, depth },
      ...flattenCategories(cat.children ?? [], depth + 1),
    ]);
  }

  function handleSelectCategory(categoryId: string) {
    if (selectedCategories.value.includes(categoryId)) {
      selectedCategories.value = selectedCategories.value.filter((id) => id !== categoryId);
    } else {
      selectedCategories.value.push(categoryId);
    }
  }

  async function handleUploadImage(
    [file]: Array<File>,
    callback: (url: UploadImgCallBackParam) => void,
  ) {
    const id = await postStore.uploadThumbnail(file, blogSlug.value);
    if (id) {
      callback([
        {
          url: `${DIRECTUS_URL}/assets/${id}`,
          alt: '',
          title: '',
        },
      ]);
      return;
    }
    callback([
      {
        url: 'error',
        alt: '',
        title: '',
      },
    ]);
  }

  function handleOpenLibrary() {
    showLibrary.value = true;
  }

  const thumbnailFileRef = ref<{ inputRef?: HTMLInputElement | null } | null>(null);

  function clickThumbnailInput() {
    thumbnailFileRef.value?.inputRef?.click();
  }

  const flatCategories = computed(() => flattenCategories(categoryStore.categoryTree));

  const mdEditorRef = ref<ExposeParam>();
  const gridDropdownVisible = ref<boolean>(false);

  function insertImgGrid(columns: 2 | 3) {
    mdEditorRef.value?.insert((selectedText) => ({
      targetValue: `::prose-img-grid{columns="${columns}"}\n${selectedText || Array(columns).fill('![]()').join('\n\n')}\n::`,
      select: true,
      deviationStart: -3,
      deviationEnd: 0,
    }));
  }
</script>

<template>
  <UForm
    :state="formState"
    class="relative flex h-[calc(100vh-64px)] flex-col"
    :validate-on="[]"
    :loading-auto="false"
    @submit.prevent
  >
    <!-- Top bar -->
    <div class="bg-default border-default border-b px-4 py-2">
      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          size="lg"
          icon="i-lucide-chevron-left"
          :to="{ name: 'blog-manage', params: { blogSlug }, query: { section: 'posts' } }"
        />
        <UFormField name="title" class="min-w-0 flex-1" :ui="{ container: 'w-full' }">
          <UInput
            v-model="title"
            type="text"
            placeholder="제목을 입력하세요"
            size="xl"
            variant="ghost"
            class="w-full"
            :ui="{
              base: 'text-2xl font-semibold px-0',
            }"
          />
        </UFormField>
        <div class="flex shrink-0 items-center gap-2">
          <UAlert
            v-if="postErr"
            color="error"
            variant="soft"
            :description="postErr"
            class="max-w-xs text-base"
          />
          <UButton
            v-if="!isEditMode || currentStatus !== 'published'"
            variant="outline"
            color="neutral"
            size="lg"
            class="shrink-0 px-4"
            :loading="isSaving && currentStatus !== 'published'"
            @click="save()"
          >
            {{ isEditMode ? '임시저장' : '저장' }}
          </UButton>
          <UButton
            size="lg"
            class="shrink-0 px-4"
            :loading="isSaving"
            :icon="isSaved ? 'i-lucide-check' : 'i-lucide-send'"
            :color="isSaved ? 'success' : 'primary'"
            @click="publish"
          >
            {{ isSaved ? '발행 완료' : '발행' }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex min-h-0 flex-1">
      <!-- Editor area -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <MdEditor
          ref="mdEditorRef"
          v-model="content"
          :theme="colorMode === 'dark' ? 'dark' : 'light'"
          class="min-h-0 flex-1"
          language="ko-KR"
          :toolbars="[
            'bold',
            'underline',
            'italic',
            'strikeThrough',
            '-',
            'title',
            'sub',
            'sup',
            'quote',
            'unorderedList',
            'orderedList',
            'task',
            '-',
            'codeRow',
            'code',
            'link',
            'image',
            0,
            'table',
            '-',
            'revoke',
            'next',
            '=',
            'preview',
            'fullscreen',
          ]"
          @upload-img="handleUploadImage"
        >
          <template #defToolbars>
            <DropdownToolbar
              title="Image Grid"
              :visible="gridDropdownVisible"
              @on-change="gridDropdownVisible = $event"
            >
              <template #trigger>
                <UIcon name="i-lucide-grid" />
              </template>
              <template #overlay>
                <div class="border-default flex flex-col rounded-md border">
                  <UButton variant="ghost" color="neutral" size="md" @click="insertImgGrid(2)">
                    {{ '2 columns' }}
                  </UButton>
                  <UButton variant="ghost" color="neutral" size="md" @click="insertImgGrid(3)">
                    {{ '3 columns' }}
                  </UButton>
                </div>
              </template>
            </DropdownToolbar>
          </template>
        </MdEditor>
      </div>

      <!-- Sidebar -->
      <aside class="border-default bg-default w-80 shrink-0 space-y-5 overflow-y-auto border-l p-4">
        <UFormField
          label="상태"
          name="status"
          orientation="horizontal"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <USelect
            v-model="status"
            :items="[
              { label: '임시저장', value: 'draft' },
              { label: '발행됨', value: 'published' },
              { label: '보관됨', value: 'archived' },
            ]"
            value-key="value"
            label-key="label"
            size="md"
          />
        </UFormField>

        <UFormField
          label="공개 범위"
          name="visibility"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <div class="flex flex-col gap-2">
            <USelect
              v-model="visibility"
              :items="[
                { label: '공개', value: 'public' },
                { label: '비공개', value: 'private' },
                { label: '보호글 개발중' },
              ]"
              value-key="value"
              label-key="label"
              size="md"
            />
            <UInput
              v-if="visibility === 'protected'"
              v-model="passwordHash"
              type="password"
              placeholder="비밀번호 입력"
              size="md"
            />
          </div>
        </UFormField>

        <UFormField
          label="썸네일"
          name="thumbnail"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <UInput
            ref="thumbnailFileRef"
            type="file"
            accept="image/*"
            class="sr-only"
            tabindex="-1"
            :disabled="isUploading"
            :ui="{ base: 'sr-only' }"
            @change="handleThumbnailChange"
          />
          <div
            v-if="thumbnailPreview"
            class="border-default relative aspect-video w-full overflow-hidden rounded-md border"
          >
            <img :src="thumbnailPreview" alt="썸네일 미리보기" class="size-full object-cover" />
            <UButton
              size="xs"
              color="error"
              variant="solid"
              icon="i-lucide-x"
              class="absolute top-1 right-1"
              @click="removeThumbnail"
            />
          </div>
          <div
            v-else
            class="border-default flex aspect-video w-full items-center justify-center gap-4 rounded-md border border-dashed"
          >
            <UButton
              color="neutral"
              variant="ghost"
              :icon="isUploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'"
              class="size-12 justify-center"
              :ui="{ leadingIcon: 'size-6' }"
              :loading="isUploading"
              title="이미지 업로드"
              @click="clickThumbnailInput"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-folder"
              class="size-12 justify-center"
              :ui="{ leadingIcon: 'size-6' }"
              title="라이브러리에서 선택"
              @click="handleOpenLibrary"
            />
          </div>
          <ThumbnailLibraryModal
            v-model:open="showLibrary"
            :blog-slug="blogSlug"
            :selected-id="thumbnailId"
            @select="selectLibraryThumbnail"
          />
        </UFormField>

        <UFormField
          label="카테고리"
          name="categories"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <div class="border-default max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
            <UCheckbox
              v-for="cat in flatCategories"
              :key="cat.id"
              :model-value="selectedCategories.includes(cat.id)"
              size="md"
              class="hover:bg-accent/30 w-full rounded px-1 py-0.5"
              :style="{ paddingLeft: `${cat.depth * 12 + 4}px` }"
              @update:model-value="handleSelectCategory(cat.id)"
            >
              <template #label>
                <span class="flex items-center gap-2 truncate">
                  <UIcon v-if="cat.icon" :name="cat.icon" class="size-4 shrink-0" />
                  <span class="truncate text-sm">{{ cat.name }}</span>
                </span>
              </template>
            </UCheckbox>
            <p v-if="flatCategories.length === 0" class="text-muted py-2 text-center text-sm">
              카테고리 없음
            </p>
          </div>
        </UFormField>

        <UFormField
          label="태그"
          name="tags"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in tags"
                :key="tag.id"
                :variant="isTagSelected(tag.id) ? 'solid' : 'outline'"
                color="neutral"
                size="md"
                class="cursor-pointer select-none"
                @click="toggleTag(tag)"
              >
                {{ tag.name }}
              </UBadge>
              <p v-if="tags.length === 0" class="text-muted text-sm">태그 없음</p>
            </div>
            <div class="flex gap-1">
              <UInput
                v-model="newTagName"
                size="md"
                placeholder="새 태그 이름"
                class="flex-1"
                @keydown.enter="createAndAddTag"
              />
              <UButton
                size="md"
                variant="outline"
                color="neutral"
                icon="i-lucide-plus"
                :loading="isCreatingTag"
                @click="createAndAddTag"
              />
            </div>
          </div>
        </UFormField>

        <UFormField
          label="시리즈"
          name="series"
          class="text-base"
          :ui="{ label: 'text-base font-medium tracking-wide opacity-60' }"
        >
          <div class="space-y-2">
            <USelect
              v-model="selectedSeriesId"
              :items="[{ id: null, name: '없음' }, ...seriesList]"
              value-key="id"
              label-key="name"
              size="md"
              class="w-full"
            />
            <div class="flex gap-1">
              <UInput
                v-model="newSeriesName"
                size="md"
                placeholder="새 시리즈 이름"
                class="flex-1"
                @keydown.enter="createAndSelectSeries"
              />
              <UButton
                size="md"
                variant="outline"
                color="neutral"
                icon="i-lucide-plus"
                :loading="isCreatingSeries"
                @click="createAndSelectSeries"
              />
            </div>
          </div>
        </UFormField>
      </aside>
    </div>
  </UForm>
</template>
