<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';

  import { getHttpStatusMessage } from '@/util/http';

  const route = useRoute();

  const httpStatusCode: number = Number(route.params.statusCode);
  const message = computed(() => {
    if (httpStatusCode === 401) {
      return 'Directus에 로그인이 되었는지 확인하세요.';
    }

    if (httpStatusCode < 400) {
      return '알 수 없는 오류입니다. 관리자에게 문의하세요.';
    }

    if (httpStatusCode < 500) {
      return '허가되지 않은 요청입니다. 관리자에게 문의하세요.';
    }

    return '서버에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  });
</script>

<template>
  <UError
    :error="{
      statusCode: httpStatusCode,
      statusMessage: getHttpStatusMessage(httpStatusCode),
      message,
    }"
  />
</template>
