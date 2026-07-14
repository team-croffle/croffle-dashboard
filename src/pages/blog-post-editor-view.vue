<script setup lang="ts">
  import Image from '@tiptap/extension-image';
  import { Placeholder } from '@tiptap/extension-placeholder';
  import { StarterKit } from '@tiptap/starter-kit';
  import { useEditor, EditorContent } from '@tiptap/vue-3';
  import { useColorMode } from '@vueuse/core';
  import {
    DropdownToolbar,
    MdEditor,
    type ExposeParam,
    type UploadImgCallBackParam,
  } from 'md-editor-v3';
  import 'md-editor-v3/lib/style.css';
  import { storeToRefs } from 'pinia';
  import { Markdown } from 'tiptap-markdown';
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

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
  const postIdx = computed(() => Number(route.params.postIdx) as number | undefined);
  const isEditMode = computed(() => !!postIdx.value);

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
  const password = ref('');
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

  // --- Editor mode ---
  type EditorMode = 'wysiwyg' | 'markdown';
  const editorMode = ref<EditorMode>('wysiwyg');

  const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;

  type TipTapMarkdownStorage = { markdown: { getMarkdown(): string } };

  // --- TipTap editor ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Markdown.configure({ html: false, tightLists: true }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: '',
    onUpdate({ editor: e }) {
      content.value = (e.storage as unknown as TipTapMarkdownStorage).markdown.getMarkdown();
    },
  });

  // Sync content → TipTap when switching to WYSIWYG
  watch(editorMode, (mode) => {
    if (mode === 'wysiwyg' && editor.value) {
      editor.value.commands.setContent(content.value);
    }
  });

  onBeforeUnmount(() => {
    editor.value?.destroy();
  });

  // --- Load data on mount ---
  onMounted(async () => {
    if (!currentBlog.value) return;
    const blogId = currentBlog.value.id;

    await Promise.all([
      categoryStore.fetchCategories(blogId),
      tagStore.fetchTags(blogId),
      seriesStore.fetchSeries(blogId),
    ]);

    if (isEditMode.value && postIdx.value) {
      await postStore.fetchPost(blogId, postIdx.value);
      if (currentPost.value) {
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
        editor.value?.commands.setContent(p.content);
      }
    }
  });

  // --- Thumbnail ---
  async function handleThumbnailChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = await postStore.uploadThumbnail(file, blogSlug.value);
    if (id) {
      thumbnailId.value = id;
      thumbnailPreview.value = `${DIRECTUS_URL}/assets/${id}`;
    }
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
  function buildPayload(overrideStatus?: PostStatus): PostSaveRequest {
    return {
      title: title.value,
      content: content.value,
      status: overrideStatus ?? status.value,
      visibility: visibility.value,
      thumbnail: thumbnailId.value,
      password: visibility.value === 'protected' ? password.value || null : null,
      categories: selectedCategories.value.map((id) => ({ categories_id: id })),
      tags: selectedTags.value.map((t) => ({ tags_id: t.id })),
      series: selectedSeries.value ? [{ series_id: selectedSeries.value.id }] : [],
    };
  }

  async function save(overrideStatus?: PostStatus) {
    if (!title.value.trim() || !currentBlog.value) return;
    const payload = buildPayload(overrideStatus);
    console.log('payload', JSON.stringify(payload, null, 2));

    if (isEditMode.value && currentPost.value) {
      await postStore.updatePost(currentPost.value.id, payload);
      currentStatus.value = payload.status;
      status.value = payload.status;
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
      console.log('current status is published', currentStatus.value);
      await save();
    } else {
      console.log('current status is not published', currentStatus.value);
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

  function handleSelectWysiwygMode() {
    editorMode.value = 'wysiwyg';
  }

  function handleSelectMarkdownMode() {
    editorMode.value = 'markdown';
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

  const flatCategories = computed(() => flattenCategories(categoryStore.categoryTree));

  const mdEditorRef = ref<ExposeParam>();
  const gridDropdownVisible = ref<boolean>(false);

  function insertImgGrid(columns: 2 | 3) {
    mdEditorRef.value?.insert((selectedText) => ({
      targetValue: `::prose-img-grid{columns="${columns}"}\n${selectedText || Array(columns).fill('![]()').join('\n')}\n::`,
      select: true,
      deviationStart: -3,
      deviationEnd: 0,
    }));
  }
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] flex-col">
    <!-- Top bar -->
    <div class="bg-default border-default border-b px-4 py-2">
      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          size="lg"
          icon="i-lucide-chevron-left"
          :to="{ name: 'blog-posts', params: { blogSlug } }"
        />
        <input
          v-model="title"
          type="text"
          placeholder="제목을 입력하세요"
          class="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none"
        />
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
            {{
              currentStatus === 'published'
                ? isSaved
                  ? '수정 완료'
                  : '수정'
                : isSaved
                  ? '발행 완료'
                  : '발행'
            }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex min-h-0 flex-1">
      <!-- Editor area -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Mode toggle -->
        <div class="border-default flex items-center gap-1 border-b px-4 py-1.5">
          <UButton
            size="xs"
            :variant="editorMode === 'wysiwyg' ? 'soft' : 'ghost'"
            color="neutral"
            icon="i-lucide-type"
            @click="handleSelectWysiwygMode"
          >
            WYSIWYG
          </UButton>
          <UButton
            size="xs"
            :variant="editorMode === 'markdown' ? 'soft' : 'ghost'"
            color="neutral"
            icon="i-lucide-code"
            @click="handleSelectMarkdownMode"
          >
            Raw Markdown
          </UButton>
        </div>

        <!-- TipTap editor -->
        <div v-show="editorMode === 'wysiwyg'" class="min-h-0 flex-1 overflow-y-auto p-6">
          <EditorContent
            :editor="editor"
            class="prose dark:prose-invert [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground max-w-none focus:outline-none [&_.ProseMirror]:min-h-75 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
          />
        </div>

        <!-- md-editor-v3 -->
        <MdEditor
          v-show="editorMode === 'markdown'"
          ref="mdEditorRef"
          v-model="content"
          :theme="colorMode === 'dark' ? 'dark' : 'light'"
          class="flex-1"
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
        <!-- Status -->
        <div class="flex gap-2">
          <label class="text-base font-medium tracking-wide opacity-60">상태</label>
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
        </div>

        <!-- Visibility -->
        <div class="flex gap-2">
          <label class="text-base font-medium tracking-wide uppercase opacity-60">공개 범위</label>
          <USelect
            v-model="visibility"
            :items="[
              { label: '공개', value: 'public' },
              { label: '비공개', value: 'private' },
              { label: '비밀번호 보호', value: 'protected' },
            ]"
            value-key="value"
            label-key="label"
            size="md"
          />
          <UInput
            v-if="visibility === 'protected'"
            v-model="password"
            type="password"
            placeholder="비밀번호 입력"
            size="sm"
          />
        </div>

        <!-- Thumbnail -->
        <div class="flex flex-col gap-2">
          <label class="text-base font-medium tracking-wide opacity-60">썸네일</label>
          <div v-if="thumbnailPreview" class="relative">
            <img
              :src="thumbnailPreview"
              alt="썸네일 미리보기"
              class="aspect-video w-full rounded-md object-cover"
            />
            <UButton
              size="xs"
              color="error"
              variant="solid"
              icon="i-lucide-x"
              class="absolute top-1 right-1"
              @click="removeThumbnail"
            />
          </div>
          <label
            class="hover:bg-accent/30 border-default flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-3 text-sm transition-colors"
          >
            <UIcon name="i-lucide-upload" class="size-5" />
            <span class="text-base">{{ isUploading ? '업로드 중...' : '이미지 선택' }}</span>
            <input type="file" accept="image/*" class="sr-only" @change="handleThumbnailChange" />
          </label>
        </div>

        <!-- Categories -->
        <div class="flex flex-col gap-2">
          <label class="text-base font-medium tracking-wide opacity-60">카테고리</label>
          <div class="border-default max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
            <label
              v-for="cat in flatCategories"
              :key="cat.id"
              class="hover:bg-accent/30 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
              :style="{ paddingLeft: `${cat.depth * 12 + 4}px` }"
            >
              <UCheckbox
                :model-value="selectedCategories.includes(cat.id)"
                size="md"
                @update:model-value="handleSelectCategory(cat.id)"
              />
              <UIcon v-if="cat.icon" :name="cat.icon" class="size-4 shrink-0" />
              <span class="truncate text-sm">{{ cat.name }}</span>
            </label>
            <p v-if="flatCategories.length === 0" class="text-muted py-2 text-center text-sm">
              카테고리 없음
            </p>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-2">
          <label class="text-base font-medium tracking-wide opacity-60">태그</label>
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

        <!-- Series -->
        <div class="flex flex-col gap-2">
          <label class="text-base font-medium tracking-wide opacity-60">시리즈</label>
          <USelect
            v-model="selectedSeriesId"
            :items="[{ id: null, name: '없음' }, ...seriesList]"
            value-key="id"
            label-key="name"
            size="md"
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
      </aside>
    </div>
  </div>
</template>
