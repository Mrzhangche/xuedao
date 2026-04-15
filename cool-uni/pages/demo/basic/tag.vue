<template>
	<cl-page :padding="20">
		<cl-card label="基础用法">
			<cl-tag>默认</cl-tag>
		</cl-card>

		<cl-card label="圆角">
			<cl-tag round>默认</cl-tag>
		</cl-card>

		<cl-card label="尺寸">
			<cl-tag size="large" :margin="[0, 20, 0, 0]">大尺寸</cl-tag>
			<cl-tag size="default" :margin="[0, 20, 0, 0]">默认尺寸</cl-tag>
			<cl-tag size="small">小尺寸</cl-tag>
		</cl-card>

		<cl-card label="标签颜色">
			<cl-tag type="primary" :margin="[0, 20, 0, 0]">主要</cl-tag>
			<cl-tag type="success" :margin="[0, 20, 0, 0]">成功</cl-tag>
			<cl-tag type="error" :margin="[0, 20, 0, 0]">失败</cl-tag>
			<cl-tag type="warning" :margin="[0, 20, 0, 0]">警告</cl-tag>
			<cl-tag type="info" :margin="[0, 20, 0, 0]">信息</cl-tag>
		</cl-card>

		<cl-card label="自定义颜色">
			<cl-tag color="#626aef">标签</cl-tag>
		</cl-card>

		<cl-card label="其他">
			<cl-tag plain :margin="[0, 20, 0, 0]">镂空</cl-tag>
			<cl-tag closable>可移除标签</cl-tag>
		</cl-card>
	</cl-page>
</template>

<script lang="ts" setup></script>
