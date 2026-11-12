import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type Sport = { name: string; emoji: string };
type Card = Sport & { id: number; matched: boolean };

const SPORTS: Sport[] = [
  { name: "サッカー", emoji: "⚽" }, { name: "バスケ", emoji: "🏀" },
  { name: "野球", emoji: "⚾" }, { name: "柔道", emoji: "🥋" },
  { name: "テニス", emoji: "🎾" }, { name: "バレー", emoji: "🏐" },
  { name: "卓球", emoji: "🏓" }, { name: "バドミントン", emoji: "🏸" },
  { name: "水泳", emoji: "🏊" }, { name: "陸上", emoji: "🏃" },
  { name: "ラグビー", emoji: "🏉" }, { name: "ボクシング", emoji: "🥊" },
  { name: "ゴルフ", emoji: "⛳" }, { name: "スキー", emoji: "⛷️" },
  { name: "スケート", emoji: "⛸️" }, { name: "体操", emoji: "🤸" },
  { name: "レスリング", emoji: "🤼" }, { name: "フェンシング", emoji: "🤺" },
  { name: "アーチェリー", emoji: "🏹" }, { name: "自転車", emoji: "🚴" },
];

const TURN_SECONDS = 20;
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

function createDeck(): Card[] {
  const chosen = shuffle(SPORTS).slice(0, 10);
  return shuffle(chosen.flatMap((sport, index) => [
    { ...sport, id: index * 2, matched: false },
    { ...sport, id: index * 2 + 1, matched: false },
  ]));
}

export default function App() {
  const [cards, setCards] = useState<Card[]>(createDeck);
  const [opened, setOpened] = useState<number[]>([]);
  const [scores, setScores] = useState([0, 0]);
  const [player, setPlayer] = useState(0);
  const [seconds, setSeconds] = useState(TURN_SECONDS);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState("同じスポーツのカードを2枚見つけよう！");
  const matchedCount = useMemo(() => cards.filter((card) => card.matched).length, [cards]);

  const resetGame = useCallback(() => {
    setCards(createDeck());
    setOpened([]);
    setScores([0, 0]);
    setPlayer(0);
    setSeconds(TURN_SECONDS);
    setLocked(false);
    setFinished(false);
    setNotice("同じスポーツのカードを2枚見つけよう！");
  }, []);

  const nextPlayer = useCallback(() => {
    setPlayer((current) => 1 - current);
    setSeconds(TURN_SECONDS);
  }, []);

  useEffect(() => {
    if (!started || finished || locked) return;
    const timer = window.setInterval(() => setSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, locked, player]);

  useEffect(() => {
    if (!started || finished || seconds !== 0) return;
    setNotice(`時間切れ！ ${player === 0 ? "プレイヤー2" : "プレイヤー1"} の番です`);
    nextPlayer();
  }, [seconds, started, finished, player, nextPlayer]);

  useEffect(() => {
    if (matchedCount === 20 && started) {
      setFinished(true);
      setNotice(scores[0] === scores[1] ? "引き分け！" : scores[0] > scores[1] ? "プレイヤー1の勝利！" : "プレイヤー2の勝利！");
    }
  }, [matchedCount, started, scores]);

  const flipCard = (id: number) => {
    if (!started || finished || locked || opened.includes(id)) return;
    const selected = cards.find((card) => card.id === id);
    if (!selected || selected.matched) return;
    const nextOpened = [...opened, id];
    setOpened(nextOpened);

    if (nextOpened.length === 2) {
      setLocked(true);
      const first = cards.find((card) => card.id === nextOpened[0]);
      if (first?.name === selected.name) {
        window.setTimeout(() => {
          setCards((current) => current.map((card) => nextOpened.includes(card.id) ? { ...card, matched: true } : card));
          setScores((current) => current.map((score, index) => index === player ? score + 1 : score));
          setOpened([]);
          setLocked(false);
          setNotice("ペア成立！もう一度あなたの番です");
          setSeconds(TURN_SECONDS);
        }, 520);
      } else {
        window.setTimeout(() => {
          setOpened([]);
          setLocked(false);
          setNotice("残念！プレイヤー交代です");
          nextPlayer();
        }, 1000);
      }
    }
  };

  const startGame = () => {
    if (finished) resetGame();
    setStarted(true);
    setNotice("同じスポーツのカードを2枚見つけよう！");
    setSeconds(TURN_SECONDS);
  };

  const backToTitle = () => {
    setStarted(false);
    resetGame();
  };

  const winner = scores[0] === scores[1] ? "引き分け" : scores[0] > scores[1] ? "プレイヤー1" : "プレイヤー2";
  const totalScore = scores[0] + scores[1];

  return (
    <main className="arena">
      <div className="mountain mountain-back" />
      <div className="mountain mountain-mid" />
      <div className="mountain mountain-front" />
      <div className="pine pine-left">♠</div><div className="pine pine-right">♠</div>
      <div className="sparkles" aria-hidden="true">✦　·　✧　　 ·　✦　　·　✧　　✦</div>

      {!started ? (
        <section className="start-screen">
          <div className="start-logo">🏆</div>
          <p className="game-kicker">SPORTS MEMORY QUEST</p>
          <h1>SPORTS<br /><span>MEMORY</span></h1>
          <p className="start-jp">スポーツ神経衰弱</p>
          <p className="start-description">20種類のスポーツから、10ペアがランダムに登場！</p>
          <button className="start-button" onClick={startGame}>ゲームスタート <span>▶</span></button>
          <p className="start-footnote">2 PLAYERS　·　20 CARDS　·　20 SECONDS</p>
        </section>
      ) : (
        <section className="game-screen">
          <header className="hud">
            <button className="menu-button" onClick={backToTitle} aria-label="メニュー・タイトルに戻る"><span /><span /><span /></button>
            <div className="energy-wrap">
              <span className="bolt">ϟ</span>
              <div className="energy-track"><div className="energy-fill" style={{ width: `${seconds / TURN_SECONDS * 100}%` }} /></div>
            </div>
            <div className={`time-readout ${seconds <= 5 ? "time-danger" : ""}`}>0:{String(seconds).padStart(2, "0")}</div>
            <div className="hud-spacer" />
            <div className="total-score">{totalScore * 100}</div>
            <div className="multiplier">1<span>X</span></div>
          </header>

          <div className="player-strip">
            <div className={`player-chip ${player === 0 && !finished ? "current" : ""}`}>
              <span className="player-dot blue" /> PLAYER 1 <b>{scores[0]}</b>
            </div>
            <div className="turn-label">{finished ? "GAME CLEAR" : `PLAYER ${player + 1} TURN`}</div>
            <div className={`player-chip ${player === 1 && !finished ? "current" : ""}`}>
              <span className="player-dot pink" /> PLAYER 2 <b>{scores[1]}</b>
            </div>
          </div>

          <div className="mission">
            <span className="mission-icon">🏆</span>
            <div><small>MISSION</small><strong>{notice}</strong></div>
            <span className="pair-count">{matchedCount / 2}<small>/10</small></span>
          </div>

          <section className="card-grid" aria-label="スポーツカード20枚">
            {cards.map((card) => {
              const isOpen = opened.includes(card.id) || card.matched;
              return (
                <button className={`memory-card ${isOpen ? "revealed" : ""} ${card.matched ? "matched" : ""}`}
                  key={card.id} onClick={() => flipCard(card.id)}
                  disabled={finished || locked || card.matched || opened.includes(card.id)}
                  aria-label={isOpen ? card.name : "裏向きのカード"}>
                  <span className="card-face card-back"><span className="trophy">♜</span><span className="card-glint">✦</span></span>
                  <span className="card-face card-front"><span className="sport-emoji">{card.emoji}</span><span className="sport-name">{card.name}</span></span>
                </button>
              );
            })}
          </section>

          {finished && <div className="win-modal"><span>🏆</span><strong>{winner}{winner === "引き分け" ? "" : "の勝利！"}</strong><button onClick={startGame}>もう一度プレイ</button></div>}

          <footer className="mission-footer">
            <span className="footer-line" />
            <strong>{finished ? "CONGRATULATIONS!" : "MATCH EQUIPMENT FROM THE SAME SPORT"}</strong>
            <span className="footer-line" />
            <small>同じ競技のカードをペアにしよう！</small>
          </footer>
        </section>
      )}
    </main>
  );
}
