export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.Zg2AX9O9.js","app":"_app/immutable/entry/app.zpzokeF1.js","imports":["_app/immutable/entry/start.Zg2AX9O9.js","_app/immutable/chunks/scheduler._FQUZU9S.js","_app/immutable/chunks/singletons.xPR6XICs.js","_app/immutable/chunks/index.fe62EE-y.js","_app/immutable/entry/app.zpzokeF1.js","_app/immutable/chunks/scheduler._FQUZU9S.js","_app/immutable/chunks/index.mJWkC7Xy.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
