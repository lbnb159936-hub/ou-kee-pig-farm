import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished farm with a game entry", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>欧桑大逃亡 · 今晚不加菜<\/title>/);
  assert.match(html, /欧记猪肉牧场/);
  assert.match(html, /进入《欧桑大逃亡》/);
  assert.match(html, /href="\/game"/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("serves the game route and keeps all playable assets", async () => {
  const response = await render("/game");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /src="\/game-static\/index\.html"/);
  assert.match(html, /title="欧桑大逃亡：今晚不加菜"/);

  const gameRoot = new URL("../public/game-static/", import.meta.url);
  await Promise.all([
    access(new URL("index.html", gameRoot)),
    access(new URL("game.css", gameRoot)),
    access(new URL("game.js", gameRoot)),
    access(new URL("key-art.png", gameRoot)),
    access(new URL("sprites-v2.png", gameRoot)),
    access(new URL("backgrounds-v3.png", gameRoot)),
    access(new URL("audio/music-meadow.wav", gameRoot)),
    access(new URL("audio/music-chase.wav", gameRoot)),
    access(new URL("audio/music-boss.wav", gameRoot)),
    access(new URL("audio/hit-heavy.wav", gameRoot)),
    access(new URL("audio/boss-slam.wav", gameRoot)),
    access(new URL("../audio/ousang-lively.mp3", gameRoot)),
  ]);

  const [gameHtml, gameScript] = await Promise.all([
    readFile(new URL("index.html", gameRoot), "utf8"),
    readFile(new URL("game.js", gameRoot), "utf8"),
  ]);
  assert.match(gameHtml, /id="game"/);
  assert.match(gameHtml, /id="start-button"/);
  assert.match(gameScript, /function triggerResonance/);
  assert.match(gameScript, /function speakOusang/);
  assert.match(gameScript, /function openUpgrade/);
  assert.match(gameScript, /function drawAtlas/);
  assert.match(gameScript, /function beginWindup/);
  assert.match(gameScript, /function createObstacles/);
  assert.match(gameScript, /function damageObstacle/);
  assert.match(gameScript, /backgrounds-v3\.png/);
});
