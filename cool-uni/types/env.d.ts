/// <reference types="vite/client" />
/// <reference types="@dcloudio/types/uni-app/index.d.ts" />
/// <reference types="../build/cool/eps.d.ts" />
/// <reference types="../uni_modules/cool-ui/types/index.d.ts" />

declare module "*.vue" {
	import { DefineComponent } from "vue";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

declare module "virtual:ctx";
declare module "virtual:eps";
declare module "@dcloudio/vite-plugin-uni";
