import { c as create_ssr_component } from "../../chunks/ssr.js";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``} ${$$result.head += `<!-- HEAD_svelte-17er95m_START -->${$$result.title = `<title>Jakob Kruse</title>`, ""}<meta name="description" content="Jakob Kruse's personal website"><!-- HEAD_svelte-17er95m_END -->`, ""}`;
});
export {
  Layout as default
};
