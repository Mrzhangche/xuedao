<template>
	<cl-page :padding="20">
		<cl-card label="基础用法">
			<cl-service :service="get()" :mask="{ text: '获取数据中' }">
				<template #default="{ data }">
					<view class="count">
						<view class="item">
							<cl-icon name="favor-fill" :size="40" :margin="[0, 0, 20, 0]"></cl-icon>
							<cl-text>{{ data?.star || 0 }}</cl-text>
						</view>

						<view class="item">
							<cl-icon name="chart-pie" :size="40" :margin="[0, 0, 20, 0]"></cl-icon>
							<cl-text>{{ data?.count || 0 }}</cl-text>
						</view>

						<view class="item">
							<cl-icon
								name="wallet-fill"
								:size="40"
								:margin="[0, 0, 20, 0]"
							></cl-icon>
							<cl-text>{{ data?.wallet || 0 }}元</cl-text>
						</view>
					</view>
				</template>
			</cl-service>
		</cl-card>
	</cl-page>
</template>

<script lang="ts" setup>
function get() {
	// 实际使用示例
	// return service.xxx.count()

	// 模拟 service 请求
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				star: Math.ceil(Math.random() * 1000),
				count: Math.ceil(Math.random() * 1000),
				wallet: Math.ceil(Math.random() * 10000),
			});
		}, 1500);
	});
}
</script>

<style lang="scss" scoped>
.count {
	display: flex;
	padding: 20rpx 0;

	.item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		text {
			&:first-child {
				font-size: 42rpx;
			}

			&:last-child {
				font-size: 30rpx;
				margin-top: 20rpx;
			}
		}
	}
}
</style>
