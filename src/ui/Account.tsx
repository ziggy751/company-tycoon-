import { useState, useEffect } from "react";
import {
  cloudState,
  requestCode,
  verifyCode,
  logoutCloud,
  importLocalCompanies,
  keepBoth,
  syncCloud,
} from "../game/cloud";
import { localCompanies } from "../game/save";
export function Account() {
  const [, render] = useState(0),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const change = () => render((n) => n + 1);
    window.addEventListener("company-cloud-change", change);
    return () => window.removeEventListener("company-cloud-change", change);
  }, []);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="muted">
        Email sign-in is optional. Local companies remain on this device. No
        passwords are collected.
      </p>
      <div className="feature-card" role="status">
        {cloudState.status}
      </div>
      {cloudState.user && cloudState.session ? (
        <>
          <h3>{cloudState.user.email}</h3>
          <button
            className="primary full"
            disabled={busy}
            onClick={() => run(() => syncCloud())}
          >
            Sync now
          </button>
          <button
            className="secondary full"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const local = await localCompanies();
                await importLocalCompanies(local);
                setMessage(
                  "Local companies copied to your account. Originals are preserved. Open My Companies to play them.",
                );
              })
            }
          >
            Import existing local companies once
          </button>
          {cloudState.conflicts.map((id) => (
            <article className="order" key={id}>
              <p>
                This company has different progress on another device. Keep both
                versions as separate companies.
              </p>
              <button
                className="primary full"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await keepBoth(id);
                    location.reload();
                  })
                }
              >
                Keep both & return to menu
              </button>
            </article>
          ))}
          <button
            className="secondary full"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await logoutCloud();
                location.reload();
              })
            }
          >
            Sign out
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (challenge) {
                await verifyCode(challenge, code);
                location.reload();
              } else {
                const r = await requestCode(email);
                setChallenge(r.challenge);
                setMessage(r.message);
              }
            });
          }}
        >
          <h3>SIGN IN OR CREATE AN ACCOUNT</h3>
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={254}
              disabled={!!challenge}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {challenge && (
            <label>
              Six-digit verification code
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          <button
            className="primary full"
            disabled={busy || !cloudState.available}
          >
            {busy
              ? "Please wait…"
              : challenge
                ? "Verify code & sign in"
                : "Email me a sign-in code"}
          </button>
          {challenge && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setChallenge("");
                setCode("");
              }}
            >
              Change email / request another code
            </button>
          )}
        </form>
      )}
      {message && (
        <p role="status" className="muted">
          {message}
        </p>
      )}
      <p className="muted">
        Cloud saving stores each company separately. Offline changes stay on
        this device and sync when a valid session reconnects. If two devices
        change the same company, neither version is silently overwritten.
      </p>
    </>
  );
}
