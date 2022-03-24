export { User } from "./durable.mjs";
export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response(e.message)
    }
  },
}
async function handleRequest(request, env) {
  let url = new URL(request.url);
  let queryString = url.searchParams;
  let uname = queryString.get("uname");
  if (!uname) {
    console.log("not contains uname");
    return new Response("invalid request", { status: 404 });
  }
  let id = env.USER.idFromName(uname);
  let obj = env.USER.get(id);
  return await obj.fetch(request);
}