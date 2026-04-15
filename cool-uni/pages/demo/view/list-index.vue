<template>
	<cl-page fullscreen>
		<cl-list-index :data="pcas"></cl-list-index>
	</cl-page>
</template>

<script lang="ts" setup>
import { onReady } from "@dcloudio/uni-app";
import { ref } from "vue";

const pcas = ref();

onReady(() => {
	uni.request({
		url: "https://cool-service.oss-cn-shanghai.aliyuncs.com/app%2Fbase%2F8fe445f06db5463386ae940d45b4bd6c_city-pcas.json",
		success(res) {
			pcas.value = res.data;
		},
	});
});
</script>
