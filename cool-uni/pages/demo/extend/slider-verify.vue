<template>
	<cl-page :padding="20">
		<view class="page">
			<cl-card label="拖动验证">
				<cl-button @tap="refs.sliderVerify?.open()">打开</cl-button>
				<cl-slider-verify title="拖动验证" :image="Bg1" :ref="setRefs('sliderVerify')" />
			</cl-card>

			<cl-card label="旋转验证">
				<cl-button @tap="refs.sliderVerify2?.open()">打开</cl-button>
				<cl-slider-verify
					title="旋转验证"
					type="rotate"
					:image="Avatar4"
					:ref="setRefs('sliderVerify2')"
				/>
			</cl-card>
		</view>
	</cl-page>
</template>

<script setup lang="ts">
import { useCool } from "/@/cool";
import Bg1 from "../static/bg1.png";
import Avatar4 from "../static/avatar4.png";

const { refs, setRefs } = useCool();
</script>
