export function announceRecordingStatus(isRecording: boolean, lang: string) {
  if (typeof window === 'undefined') return;

  // 1. Play Audio Chime Tone using Web Audio API
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // High chime for start recording, lower tone for stop recording
      osc.frequency.setValueAtTime(isRecording ? 880 : 440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (err) {
    // Web audio playback fallback
  }

  // 2. Web Speech API Speech Synthesis with Female Voice
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      const isArabic = lang.includes('Arabic') || lang.includes('العربية');
      const text = isRecording 
        ? (isArabic ? 'تنبيه: يتم الآن تسجيل هذا الاجتماع.' : 'This meeting is being recorded now.')
        : (isArabic ? 'تم إيقاف تسجيل الاجتماع.' : 'Recording has been stopped.');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05; // Slightly higher pitch for natural female voice tone
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      
      // Look specifically for female voices in system speech synth
      const femaleVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        const matchesLang = isArabic ? v.lang.startsWith('ar') : v.lang.startsWith('en');
        const isFemale = name.includes('female') || 
                         name.includes('samantha') || 
                         name.includes('zira') || 
                         name.includes('victoria') || 
                         name.includes('karen') || 
                         name.includes('fiona') || 
                         name.includes('google us english') ||
                         name.includes('aria') ||
                         name.includes('jenny');
        return matchesLang && isFemale;
      }) || voices.find(v => (isArabic ? v.lang.startsWith('ar') : v.lang.startsWith('en')));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Small delay to let audio chime sound first
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 150);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }
}
