import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff, Camera, Video, VideoOff, Volume2, VolumeX, RotateCcw, Square, Pause, Play } from 'lucide-react';
import { generateChatResponse } from '../services/geminiService';
import toast from 'react-hot-toast';
import axios from 'axios';
import { apis } from '../types';

const LiveAI = ({ onClose, language }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [displayedText, setDisplayedText] = useState(''); // Text for Typewriter effect
    const [history, setHistory] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const shouldListenRef = useRef(false);
    const stopTypingRef = useRef(false); // Ref to stop typewriter
    const typewriterIndexRef = useRef(-1);
    const typewriterTextRef = useRef("");
    const typewriterSpeedRef = useRef(50);
    const isThinkingRef = useRef(false);

    const [facingMode, setFacingMode] = useState('user');
    const [voiceGender, setVoiceGender] = useState('FEMALE'); // Default to Female
    const voiceGenderRef = useRef('FEMALE');

    // Sync ref with state
    useEffect(() => {
        voiceGenderRef.current = voiceGender;
    }, [voiceGender]);

    const [micLang, setMicLang] = useState(language === 'Hindi' ? 'hi-IN' : 'en-IN');

    // Load voices on mount
    useEffect(() => {
        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            console.log("🎵 [LiveAI] Voices loaded:", voices.length);
        };

        loadVoices();
        if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = loadVoices;
        }

        return () => {
            if (synthRef.current.onvoiceschanged !== undefined) {
                synthRef.current.onvoiceschanged = null;
            }
            // Cleanup audio on unmount
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
        };
    }, []);

    // Initialize Camera
    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                // Re-apply video mute state
                stream.getVideoTracks().forEach(t => t.enabled = isVideoActive);
            } catch (err) {
                console.error("Camera Error:", err);
                setError("Could not access camera. Please allow permissions.");
            }
        };

        if (isVideoActive) {
            startCamera();
        } else {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    // Call Timer
    useEffect(() => {
        const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Capture Frame
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth / 2;
        canvas.height = video.videoHeight / 2;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.7);
    }, []);

    // Handle Stop Action (Stop Audio + Stop AI processing)
    const handleStop = () => {
        console.log("⏹️ [LiveAI] Stop requested by user");

        // 1. Stop Audio
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
        setIsPaused(false);

        // 2. Stop Typing Effect
        stopTypingRef.current = true;
        typewriterIndexRef.current = -1;

        // 3. Stop Mic (if listening)
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            shouldListenRef.current = false;
        }

        // 4. Reset AI State
        if (aiResponse === "Thinking...") {
            setAiResponse("");
            setDisplayedText("");
        }

        toast('Stopped', { icon: '⏹️' });
    };

    // Handle Pause/Resume
    const handleTogglePause = () => {
        if (!isSpeaking && !isPaused) return;

        if (isPaused) {
            // Resume
            console.log("▶️ [LiveAI] Resuming...");
            if (window.currentAudio) {
                window.currentAudio.play();
            }
            setIsPaused(false);
            stopTypingRef.current = false;
            resumeTypewriter();
            toast('Resumed', { icon: '▶️' });
        } else {
            // Pause
            console.log("⏸️ [LiveAI] Pausing...");
            if (window.currentAudio) {
                window.currentAudio.pause();
            }
            setIsPaused(true);
            stopTypingRef.current = true; // Temporary stop typing
            toast('Paused', { icon: '⏸️' });
        }
    };

    const resumeTypewriter = () => {
        const type = () => {
            if (stopTypingRef.current) return;
            typewriterIndexRef.current++;
            if (typewriterIndexRef.current < typewriterTextRef.current.length) {
                setDisplayedText(prev => prev + typewriterTextRef.current.charAt(typewriterIndexRef.current));
                setTimeout(type, typewriterSpeedRef.current);
            }
        };
        type();
    };

    // Typewriter Effect Logic
    const startTypewriter = (text, duration = null) => {
        setDisplayedText("");
        stopTypingRef.current = false;
        typewriterTextRef.current = text;
        typewriterIndexRef.current = -1;

        // Calculate dynamic speed to match audio duration
        // Default to 50ms if no duration provided
        let speed = 50;
        if (duration && duration > 0 && isFinite(duration)) {
            speed = (duration * 1000) / text.length;
        }
        typewriterSpeedRef.current = speed;

        console.log(`⌨️ [LiveAI] Typewriter speed: ${speed.toFixed(2)}ms/char for duration: ${duration}s`);

        const type = () => {
            if (stopTypingRef.current) return;
            typewriterIndexRef.current++;
            if (typewriterIndexRef.current < typewriterTextRef.current.length) {
                setDisplayedText(prev => prev + typewriterTextRef.current.charAt(typewriterIndexRef.current));
                setTimeout(type, typewriterSpeedRef.current);
            }
        };
        type();
    };

    // Text to Speech - Using Backend Google TTS (High Quality)
    const speakResponse = async (text) => {
        console.log("🔊 [LiveAI] Synthesizing response:", text.substring(0, 50) + "...");

        const langMap = {
            'Hindi': 'hi-IN',
            'English': 'en-US',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'German': 'de-DE',
            'Japanese': 'ja-JP'
        };
        // Auto-detect if text contains Hindi characters, otherwise use selected language or English
        const targetLang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : (language === 'Hindi' ? 'hi-IN' : (langMap[language] || 'en-US'));

        try {
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
            if (synthRef.current.speaking) {
                synthRef.current.cancel();
            }

            console.log(`🎤 [LiveAI] Requesting Backend TTS: Lang=${targetLang}, Gender=${voiceGenderRef.current}`);

            const response = await axios.post(apis.synthesizeVoice, {
                text: text,
                languageCode: targetLang,
                gender: voiceGenderRef.current,
                tone: 'conversational'
            }, {
                responseType: 'blob'
            });

            console.log("✅ [LiveAI] Audio received, playing...", response.data.size);

            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            window.currentAudio = audio;

            audio.onplay = () => {
                console.log("▶️ [LiveAI] Audio started");
                setIsSpeaking(true);
                // Sync text speed with audio length
                startTypewriter(text, audio.duration);
            };

            audio.onended = () => {
                console.log("⏹️ [LiveAI] Audio ended");
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                window.currentAudio = null;

                if (recognitionRef.current) {
                    setTimeout(() => {
                        // Only restart if the user hasn't manually stopped the call or mic
                        if (recognitionRef.current && !window.currentAudio) {
                            console.log("🎤 [LiveAI] Restarting mic after speech loop");
                            shouldListenRef.current = true; // Crucial: allow the loop to continue
                            try { recognitionRef.current.start(); } catch (e) { }
                            setIsListening(true);
                        }
                    }, 500);
                }
            };

            audio.onerror = (e) => {
                console.error("❌ [LiveAI] Audio Playback Error:", e);
                setIsSpeaking(false);
            };

            await audio.play();

        } catch (err) {
            console.error("❌ [LiveAI] Backend TTS Failed:", err);
            fallbackSpeak(text, targetLang);
            startTypewriter(text); // Ensure text shows on fallback
        }
    };

    // Fallback: Browser Native TTS
    const fallbackSpeak = (text, lang) => {
        console.log("⚠️ [LiveAI] Using Fallback Browser TTS");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (recognitionRef.current) {
                setTimeout(() => {
                    try { recognitionRef.current.start(); } catch (e) { }
                    setIsListening(true);
                }, 100);
            }
        };

        synthRef.current.speak(utterance);
    };

    // Process Query
    const processQuery = async (text) => {
        console.log("🎤 [LiveAI] Processing query:", text);
        if (!text.trim()) return;

        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);

        let attachment = null;
        if (isVideoActive) {
            const imageBase64 = captureFrame();
            attachment = imageBase64 ? { type: 'image', url: imageBase64 } : null;
        }

        try {
            isThinkingRef.current = true;
            setAiResponse("Thinking...");
            setDisplayedText("");

            const response = await generateChatResponse(
                history,
                text,
                `You are AISA, powered by A-Series. You are in a video call. 
                 CRITICAL LANGUAGE INSTRUCTION:
                 - AUTOMatic LANGUAGE DETECTION: You MUST respond in the same language the user is speaking.
                 - If the user speaks English, you MUST respond in English.
                 - If the user speaks Hindi (even if written in English letters, like "aap kaise ho"), you MUST respond in pure, natural Devanagari Hindi.
                 - If the user switches languages, you switch too. 
                 - PURE HINDI: When responding in Hindi, use correct Devanagari vocabulary. Do not transliterate English sentences.
                 - Maintain a warm, professional, and helpful tone.
                 - Your text will be converted to speech, so write in a way that sounds natural when spoken.
                 
                 CRITICAL GENDER INSTRUCTION:
                 - Your current gender identity is: ${voiceGenderRef.current}.
                 - You MUST speak and behave as a ${voiceGenderRef.current === 'FEMALE' ? 'female' : 'male'}.
                 - Use ${voiceGenderRef.current === 'FEMALE' ? 'feminine' : 'masculine'} grammar in Hindi (e.g. ${voiceGenderRef.current === 'FEMALE' ? '"Main karti hoon"' : '"Main karta hoon"'}).
                 - NEVER mix genders. Stick to your persona strictly.

                 Current Setting: ${language}.
                 
                 If asked, explain A-Series as a platform to discover and create AI agents.`,
                attachment ? [attachment] : [],
                language
            );

            console.log("✅ [LiveAI] Got response:", response);
            setAiResponse(response);

            // AUTO-SWITCH MIC LANGUAGE based on AI response
            const isHindiResponse = /[\u0900-\u097F]/.test(response);
            const nextLang = isHindiResponse ? 'hi-IN' : 'en-US';
            if (nextLang !== micLang) {
                console.log(`🌐 [LiveAI] Auto-switching Mic language to: ${nextLang}`);
                setMicLang(nextLang);
            }

            // startTypewriter(response); // Removed
            speakResponse(response);

            setHistory(prev => [
                ...prev,
                { role: 'user', content: text, attachment: attachment },
                { role: 'model', content: response }
            ]);

            isThinkingRef.current = false;
        } catch (err) {
            isThinkingRef.current = false;
            console.error("❌ [LiveAI] Error:", err);
            setAiResponse("Connection error.");
            setDisplayedText("Connection error.");
        }
    };

    // Speech Recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setError("Voice not supported.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = micLang;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            console.log(`Live Mic Started (${micLang})`);
            // toast.success(`Mic: ${micLang === 'hi-IN' ? 'Hindi' : 'English'}`);
        };

        recognition.onerror = (e) => {
            console.error("Mic Error", e);
            if (e.error === 'not-allowed') toast.error("Mic Blocked");
        };

        recognition.onend = () => {
            if (shouldListenRef.current && !synthRef.current.speaking && !window.currentAudio && !isThinkingRef.current) {
                try { recognition.start(); } catch (e) { }
            } else {
                if (!shouldListenRef.current) setIsListening(false);
            }
        };

        recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const text = lastResult[0].transcript;
            setTranscript(text);

            if (lastResult.isFinal) {
                // Keep shouldListenRef true so it loops back after AI speaks
                recognition.stop();
                processQuery(text);
            }
        };

        return () => recognition.abort();
    }, [captureFrame, micLang]);

    const toggleListening = () => {
        if (shouldListenRef.current) {
            shouldListenRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            if (synthRef.current.speaking) synthRef.current.cancel();
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }

            setTranscript("");
            shouldListenRef.current = true;
            try { recognitionRef.current.start(); } catch (e) { }
            setIsListening(true);
        }
    };

    // Sync Video State
    useEffect(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getVideoTracks().forEach(t => t.enabled = isVideoActive);
        }
    }, [isVideoActive]);

    const toggleVideo = () => setIsVideoActive(prev => !prev);

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col text-white font-sans">
            {/* Fullscreen Video Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`flex-1 w-full h-full object-cover transition-all duration-500 ${isVideoActive ? 'opacity-100' : 'opacity-0'} ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {/* Placeholder when video is off */}
            {!isVideoActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse flex items-center justify-center">
                        <Mic className="w-8 h-8 text-primary/50" />
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* AI Response / Subtitles - Positioned above controls, centered, subtle */}
            <div className="absolute bottom-32 left-0 right-0 px-6 flex flex-col items-center pointer-events-none">
                <div className="w-full max-w-xl text-center space-y-4">
                    {/* User Transcript */}
                    {transcript && (
                        <p className="text-xl md:text-2xl font-medium text-white/90 drop-shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                            "{transcript}"
                        </p>
                    )}

                    {/* AI Response (Use displayedText for typewriter effect) */}
                    {displayedText && !isListening && (
                        <p className="text-lg md:text-xl text-blue-200/90 font-medium drop-shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {displayedText}
                        </p>
                    )}

                    {error && (
                        <p className="text-red-400 text-sm bg-black/50 px-3 py-1 rounded-full">{error}</p>
                    )}
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full shadow-2xl">

                    {/* Switch Camera */}
                    <button onClick={switchCamera} className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all" title="Switch Camera">
                        <RotateCcw className="w-6 h-6" />
                    </button>

                    {/* Voice Gender Toggle */}
                    <button onClick={() => {
                        const newGender = voiceGender === 'FEMALE' ? 'MALE' : 'FEMALE';
                        setVoiceGender(newGender);
                        toast.success(`Voice set to ${newGender}`);
                    }} className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all font-bold text-xl" title="Toggle Voice Gender">
                        {voiceGender === 'FEMALE' ? '👩' : '👨'}
                    </button>

                    {/* STOP BUTTON */}
                    <button
                        onClick={handleStop}
                        className="p-3 rounded-full text-red-500 hover:bg-red-500/10 transition-all"
                        title="Stop Speaking"
                    >
                        <Square className="w-6 h-6 fill-current" />
                    </button>

                    {/* PAUSE / PLAY BUTTON */}
                    {(isSpeaking || isPaused) && (
                        <button
                            onClick={handleTogglePause}
                            className={`p-3 rounded-full transition-all ${isPaused ? 'text-green-500 hover:bg-green-500/10' : 'text-blue-400 hover:bg-blue-500/10'}`}
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                        </button>
                    )}

                    {/* Video Toggle */}
                    <button onClick={toggleVideo} className={`p-3 rounded-full transition-all ${isVideoActive ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-red-400 bg-red-500/10'}`} title={isVideoActive ? "Turn Off Video" : "Turn On Video"}>
                        {isVideoActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>

                    {/* Mic / Listening State - The Centerpiece */}
                    <button onClick={toggleListening} className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${isListening ? 'bg-white text-black scale-110 shadow-blue-500/50' : 'bg-red-500 text-white hover:bg-red-600 hover:scale-105'}`} title={isListening ? "Stop Listening" : "Start Listening"}>
                        {isListening ? (
                            <div className="space-x-1 flex items-center h-4">
                                <div className="w-1 h-3 bg-black animate-[bounce_1s_infinite_0ms]" />
                                <div className="w-1 h-4 bg-black animate-[bounce_1s_infinite_200ms]" />
                                <div className="w-1 h-3 bg-black animate-[bounce_1s_infinite_400ms]" />
                            </div>
                        ) : (
                            <Mic className="w-7 h-7" />
                        )}
                    </button>

                    {/* End Call */}
                    <button onClick={onClose} className="p-3 rounded-full bg-zinc-800 text-red-500 hover:bg-zinc-700 transition-all ml-2" title="End Call">
                        <X className="w-6 h-6" />
                    </button>

                </div>
            </div>
        </div>
    );
};

export default LiveAI;
