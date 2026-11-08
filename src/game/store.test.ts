import { it, expect, vi } from "vitest";
vi.mock("./save", () => ({ saveGame: vi.fn() }));
import { saveGame } from "./save";
import { useGame } from "./store";
import { newGame } from "./simulation";
it("reports Saving until the newest queued snapshot is durably committed", async () => {
  const writes: (() => void)[] = [];
  vi.mocked(saveGame).mockImplementation(
    () => new Promise<void>((resolve) => writes.push(resolve)),
  );
  const g = newGame();
  useGame.getState().setGame(g);
  const first = useGame.getState().save();
  await vi.waitFor(() => expect(writes).toHaveLength(1));
  useGame.getState().setGame({ ...g, player: [0, 15] });
  const second = useGame.getState().save();
  expect(useGame.getState().saveStatus).toBe("Saving…");
  writes[0]();
  await first;
  expect(useGame.getState().saveStatus).toBe("Saving…");
  await vi.waitFor(() => expect(writes).toHaveLength(2));
  expect(vi.mocked(saveGame).mock.calls[1][1].player).toEqual([0, 15]);
  writes[1]();
  expect(await second).toBe(true);
  expect(useGame.getState().saveStatus).toBe("Saved locally");
});
