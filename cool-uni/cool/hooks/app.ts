import { reactive, ref } from "vue";
import { storage } from "../utils";
import { config } from "/@/config";
import { defineStore } from "pinia";

// 主题
export const useTheme = defineStore("theme", () => {
	const name = ref(storage.get("theme") || "default");

	function set(value: string) {
		name.value = value;
		storage.set("theme", value);
	}

	return {
		name,
		set,
	};
});

export function useApp() {
	const info = reactive(config.app);

	return {
		info,
		theme: useTheme(),
	};
}
