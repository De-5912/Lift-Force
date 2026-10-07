const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");
const agent = path.resolve("node_modules/agent-browser/bin/agent-browser.js");
const run = (...args) =>
  execFileSync(process.execPath, [agent, "--session", "liftwork", ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
const origin = "http://127.0.0.1:3000";
run("set", "viewport", "1440", "1000");
run("open", `${origin}/requirements`);
assert.match(run("get", "url"), /sign-in/);
const routes = [
  "/",
  "/requirements",
  "/requirements/00000000-0000-4000-8000-000000001000",
  "/manpower",
  "/workers",
  "/vendors",
  "/profiles/00000000-0000-4000-8000-000000000004",
  "/how-it-works",
  "/about",
  "/contact",
  "/register",
  "/sign-in",
  "/forgot-password",
];
for (const width of [390, 768, 1440]) {
  run("set", "viewport", String(width), "900");
  for (const route of routes) {
    run("open", `${origin}${route}`);
    const result = JSON.parse(
      run(
        "eval",
        'JSON.stringify({overflow:document.documentElement.scrollWidth>innerWidth,content:document.body.innerText.length,overlay:!!document.querySelector("[data-nextjs-dialog]")})',
      ),
    );
    const state = typeof result === "string" ? JSON.parse(result) : result;
    assert.equal(state.overflow, false, `${route} overflows at ${width}`);
    assert.ok(state.content > 100, `${route} is blank`);
    assert.equal(state.overlay, false, `${route} has error overlay`);
  }
}
run("open", `${origin}/dashboard`);
assert.match(run("get", "url"), /sign-in/);
run("set", "viewport", "390", "844");
run("open", origin);
run("screenshot", "artifacts/home-mobile.png", "--full");
run("set", "viewport", "1440", "1000");
run("open", origin);
run("screenshot", "artifacts/home-desktop.png", "--full");
console.log(
  "PASS: anonymous requirement protection and public route rendering at 390/768/1440px.",
);
console.log("Browser errors:", run("errors"));
