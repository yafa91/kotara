// Génère un petit bip aigu (style scanner de caisse), sans fichier audio externe.
export function jouerBip() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const contexte = new AudioCtx();
    const oscillateur = contexte.createOscillator();
    const gain = contexte.createGain();

    oscillateur.type = 'sine';
    oscillateur.frequency.value = 880;

    gain.gain.setValueAtTime(0.3, contexte.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, contexte.currentTime + 0.15);

    oscillateur.connect(gain);
    gain.connect(contexte.destination);

    oscillateur.start();
    oscillateur.stop(contexte.currentTime + 0.15);
  } catch {
    // Audio non supporté par le navigateur : on ignore silencieusement
  }
}
