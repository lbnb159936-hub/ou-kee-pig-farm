export default function GamePage() {
  return (
    <main style={{ width: "100vw", height: "100dvh", margin: 0, overflow: "hidden", background: "#120c12" }}>
      <iframe
        src="/game-static/index.html"
        title="欧桑大逃亡：今晚不加菜"
        allow="autoplay"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </main>
  );
}
