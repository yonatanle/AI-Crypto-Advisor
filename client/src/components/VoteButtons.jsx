export function VoteButtons({ userVote, onVote }) {
  return (
    <div className="vote-buttons">
      <button
        className={`vote-btn ${userVote === 1 ? "active up" : ""}`}
        onClick={() => onVote(1)}
        aria-label="Thumbs up"
      >
        👍
      </button>
      <button
        className={`vote-btn ${userVote === -1 ? "active down" : ""}`}
        onClick={() => onVote(-1)}
        aria-label="Thumbs down"
      >
        👎
      </button>
    </div>
  );
}
