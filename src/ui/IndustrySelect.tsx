import {
  INDUSTRIES,
  FUTURE_INDUSTRIES,
  type IndustryId,
} from "../game/industries";
export function IndustrySelect({
  choose,
  back,
}: {
  choose: (id: IndustryId) => void;
  back: () => void;
}) {
  return (
    <div className="modal-shade">
      <section className="industry-screen">
        <button className="close" aria-label="Back to main menu" onClick={back}>
          ×
        </button>
        <span className="eyebrow">YOUR NEXT CHAPTER / CHOOSE AN INDUSTRY</span>
        <h1>What will you build?</h1>
        <p>
          Three complete starter workflows. One shared economy. A separate save
          for every company.
        </p>
        <div className="industry-grid">
          {INDUSTRIES.map((i, n) => (
            <button
              className={"industry-card industry-" + i.id}
              key={i.id}
              aria-label={"Choose " + i.name}
              onClick={() => choose(i.id)}
            >
              <div className="industry-illustration">
                <span>{["THREAD / 01", "TRAIL / 02", "FORM / 03"][n]}</span>
                <b>{["✳", "↟", "〰"][n]}</b>
              </div>
              <span className="eyebrow">{i.tag}</span>
              <h2>{i.name}</h2>
              <p>{i.description}</p>
              <small>{i.difficulty}</small>
              <div className="industry-method">{i.workflow}</div>
              <strong>Start this company ↗</strong>
            </button>
          ))}
        </div>
        <h3>FUTURE INDUSTRIES — NOT PLAYABLE YET</h3>
        <div className="future-industries">
          {FUTURE_INDUSTRIES.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
