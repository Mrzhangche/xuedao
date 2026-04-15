<template>
	<cl-page :padding="20">
		<cl-card label="尺寸">
			<cl-icon name="like"></cl-icon>
			<cl-icon name="like" :size="40"></cl-icon>
			<cl-icon name="like" :size="50"></cl-icon>
		</cl-card>

		<cl-card label="颜色">
			<cl-icon name="like" color="primary"></cl-icon>
			<cl-icon name="like" color="error"></cl-icon>
			<cl-icon name="like" color="success"></cl-icon>
		</cl-card>

		<cl-card label="方向">
			<cl-grid :column="4">
				<cl-grid-item v-for="item in arrow" :key="item">
					<view class="item" @tap="copy(item)">
						<cl-icon :name="item" :size="44"></cl-icon>
						<cl-text :value="item" align="center" :margin="[15, 10, 0, 10]" />
					</view>
				</cl-grid-item>
			</cl-grid>
		</cl-card>

		<cl-card label="操作">
			<cl-grid :column="4">
				<cl-grid-item v-for="item in op" :key="item">
					<view class="item" @tap="copy(item)">
						<cl-icon :name="item" :size="44"></cl-icon>
						<cl-text :value="item" align="center" :margin="[15, 10, 0, 10]" />
					</view>
				</cl-grid-item>
			</cl-grid>
		</cl-card>

		<cl-card label="展示">
			<cl-grid :column="4">
				<cl-grid-item v-for="item in dis" :key="item">
					<view class="item" @tap="copy(item)">
						<cl-icon :name="item" :size="44"></cl-icon>
						<cl-text :value="item" align="center" :margin="[15, 10, 0, 10]" />
					</view>
				</cl-grid-item>
			</cl-grid>
		</cl-card>

		<cl-card label="圆形">
			<cl-grid :column="4">
				<cl-grid-item v-for="item in circular" :key="item">
					<view class="item" @tap="copy(item)">
						<cl-icon :name="item" :size="44"></cl-icon>
						<cl-text :value="item" align="center" :margin="[15, 10, 0, 10]" />
					</view>
				</cl-grid-item>
			</cl-grid>
		</cl-card>

		<cl-card label="其他">
			<cl-grid :column="4">
				<cl-grid-item v-for="item in list" :key="item">
					<view class="item" @tap="copy(item)">
						<cl-icon :name="item" :size="44"></cl-icon>
						<cl-text :value="item" align="center" :margin="[15, 10, 0, 10]" />
					</view>
				</cl-grid-item>
			</cl-grid>
		</cl-card>
	</cl-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const arrow = ref([
	"top",
	"back-top",
	"upgrade",
	"",
	"back",
	"enter",
	"",
	"",
	"arrow-double-left",
	"arrow-double-right",
	"",
	"",
	"arrow-bottom",
	"arrow-top",
	"arrow-left",
	"arrow-right",
	"caret-bottom",
	"caret-top",
]);

const op = ref([
	"plus",
	"minus",
	"plus-border",
	"minus-border",
	"enlarge",
	"shrink",
	"",
	"",
	"check",
	"close",
	"success-fill",
	"delete-fill",
	"toast-success",
	"toast-error",
	"",
	"",
	"cloud-download",
	"cloud-upload",
	"delete",
	"stop",
]);

const dis = ref([
	"meh",
	"meh-fill",
	"cry",
	"cry-fill",
	"smile",
	"smile-fill",
	"like",
	"like-fill",
	"location",
	"location-fill",
	"notification",
	"notification-fill",
	"eye-open",
	"eye-close",
	"favor-fill",
	"good-fill",
]);

const circular = ref([
	"chart-pie",
	"play",
	"more",
	"keyboard-9",
	"keyboard-26",
	"time",
	"refresh",
	"check-border",
	"close-border",
	"help-border",
	"warning-border",
	"toast-waiting",
	"clock-fill",
	"help-fill",
	"prompt-fill",
]);

const list = ref([
	"exit",
	"qrcode",
	"msg",
	"app",
	"payment",
	"face-auth",
	"folder",
	"bill",
	"phone",
	"share",
	"link",
	"rise",
	"decline",
	"active",
	"cropper",
	"fullscreen",
	"chart-bar",
	"set",
	"map",
	"calendar",
	"customer-service",
	"edit",
	"scan",
	"pay",
	"image",
	"search",
	"toast-warning",
	"history-fill",
	"amount-fill",
	"wallet-fill",
	"doc-fill",
	"camera-fill",
	"mail-fill",
	"bank-card-fill",
	"relay-fill",
	"comment-fill",
]);

function copy(name: string) {
	uni.setClipboardData({
		data: name,
	});
}
</script>

<style lang="scss" scoped>
.item {
	display: flex;
	flex-direction: column;
	align-items: center;
	height: 150rpx;
	padding-top: 20rpx;
}
</style>
