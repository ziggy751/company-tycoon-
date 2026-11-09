let context: AudioContext | undefined;
export function workshopSound(command: string, volume: number) {
  if (!volume) return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = command === "press" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(
      command === "press" ? 110 : command === "seal" ? 180 : 320,
      context.currentTime,
    );
    gain.gain.setValueAtTime(volume * 0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
  } catch {
    /* Audio is optional. */
  }
}
