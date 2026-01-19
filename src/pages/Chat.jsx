import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Send, Bot, User, Sparkles, Plus, Monitor, ChevronDown, History, Paperclip, X, FileText, Image as ImageIcon, Cloud, HardDrive, Edit2, Download, Mic, Wand2, Eye, FileSpreadsheet, Presentation, File, MoreVertical, Trash2, Check, Camera, Video, Copy, ThumbsUp, ThumbsDown, Share } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { generateChatResponse } from '../services/geminiService';
import { chatStorageService } from '../services/chatStorageService';
import { useLanguage } from '../context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from '../Components/Loader/Loader';
import toast from 'react-hot-toast';
import LiveAI from '../Components/LiveAI';

import ImageEditor from '../Components/ImageEditor';
import ModelSelector from '../Components/ModelSelector';
import axios from 'axios';
import { apis } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';


const FEEDBACK_PROMPTS = {
  en: [
    "Was this helpful?",
    "How did I do?",
    "Is this answer detailed enough?",
    "Did I answer your question?",
    "Need anything else?",
    "Is this what you were looking for?",
    "Happy to help!",
    "Let me know if you need more info",
    "Any other questions?",
    "Hope this clears things up!"
  ],
  hi: [
    "क्या यह मददगार था?",
    "मैंने कैसा किया?",
    "क्या यह जवाब पर्याप्त है?",
    "क्या मैंने आपके सवाल का जवाब दिया?",
    "कुछ और चाहिए?",
    "क्या आप यही खोज रहे थे?",
    "मदद करके खुशी हुई!",
    "अगर और जानकारी चाहिए तो बताएं",
    "कोई और सवाल?",
    "उम्मीद है यह समझ आया!"
  ]
};

const TOOL_PRICING = {
  chat: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Free chat model' }
    ]
  },
  image: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Basic image analysis' },
      { id: 'gemini-pro', name: 'Gemini Pro Vision', price: 0.02, speed: 'Medium', description: 'Advanced image understanding' },
      { id: 'gpt4-vision', name: 'GPT-4 Vision', price: 0.05, speed: 'Slow', description: 'Premium image analysis' }
    ]
  },
  document: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Basic document analysis' },
      { id: 'gemini-pro', name: 'Gemini Pro', price: 0.02, speed: 'Medium', description: 'Advanced document processing' },
      { id: 'gpt4', name: 'GPT-4', price: 0.03, speed: 'Medium', description: 'Premium document analysis' }
    ]
  },
  voice: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Standard voice recognition' }
    ]
  }
};

const Chat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [excelHTML, setExcelHTML] = useState(null);
  const [textPreview, setTextPreview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || 'new');

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [activeAgent, setActiveAgent] = useState({ name: 'AISA', category: 'General' });
  const [userAgents, setUserAgents] = useState([]);
  const [toolModels, setToolModels] = useState({
    chat: 'gemini-flash',
    image: 'gemini-flash',
    document: 'gemini-flash',
    voice: 'gemini-flash'
  });
  const uploadInputRef = useRef(null);
  const driveInputRef = useRef(null);
  const photosInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Attachment Menu State
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTime, setListeningTime] = useState(0);
  const timerRef = useRef(null);
  const attachBtnRef = useRef(null);
  const menuRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedToolType, setSelectedToolType] = useState(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        attachBtnRef.current &&
        !attachBtnRef.current.contains(event.target)
      ) {
        setIsAttachMenuOpen(false);
      }
    };

    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  const processFile = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    setSelectedFiles(prev => [...prev, file]);

    // Generate Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreviews(prev => [...prev, {
        url: reader.result,
        name: file.name,
        type: file.type,
        size: file.size,
        id: Math.random().toString(36).substr(2, 9)
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => processFile(file));
  };

  const handlePaste = (e) => {
    // Handle files pasted from file system
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      const files = Array.from(e.clipboardData.files);
      files.forEach(file => processFile(file));
      return;
    }

    // Handle pasted data items
    if (e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
          }
        }
      }
    }
  };

  const handleRemoveFile = (id) => {
    if (id) {
      // Find the file name to remove from selectedFiles
      const previewToRemove = filePreviews.find(p => p.id === id);
      if (previewToRemove) {
        setSelectedFiles(prev => prev.filter(f => f.name !== previewToRemove.name));
        setFilePreviews(prev => prev.filter(p => p.id !== id));
      }
    } else {
      // Clear all
      setSelectedFiles([]);
      setFilePreviews([]);
    }
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (driveInputRef.current) driveInputRef.current.value = '';
    if (photosInputRef.current) photosInputRef.current.value = '';
  };

  const handleAttachmentSelect = (type) => {
    setIsAttachMenuOpen(false);
    if (type === 'upload') {
      uploadInputRef.current?.click();
    } else if (type === 'photos') {
      photosInputRef.current?.click();
    } else if (type === 'drive') {
      driveInputRef.current?.click();
    }
  };

  const handleModelSelect = (modelId) => {
    if (selectedToolType) {
      setToolModels(prev => ({
        ...prev,
        [selectedToolType]: modelId
      }));
      const selectedModel = TOOL_PRICING[selectedToolType].models.find(m => m.id === modelId);
      toast.success(`Switched to ${selectedModel?.name}`);
      setIsModelSelectorOpen(false);
    }
  };


  useEffect(() => {
    const loadSessions = async () => {
      const data = await chatStorageService.getSessions();
      setSessions(data);

      // Fetch User Subscribed Agents
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || user?._id;
        if (userId) {
          const res = await axios.post(apis.getUserAgents, { userId });
          const agents = res.data?.agents || [];
          // Add default AISA agent if not present
          const processedAgents = [{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA.png' }, ...agents];
          setUserAgents(processedAgents);

          // Find agent if already chatting with one (placeholder for now)
          // For now, default to AISA
        }
      } catch (err) {
        console.error("Error fetching user agents:", err);
        setUserAgents([{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA.png' }]);
      }
    };
    loadSessions();
  }, [messages]);

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const initChat = async () => {
      // If we just navigated from 'new' to a real ID in handleSendMessage,
      // don't clear the messages we already have in state.
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      if (sessionId && sessionId !== 'new') {
        setCurrentSessionId(sessionId);
        const history = await chatStorageService.getHistory(sessionId);
        setMessages(history);
      } else {
        setCurrentSessionId('new');
        setMessages([]);
      }

      setShowHistory(false);
    };
    initChat();
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = async () => {
    const newId = await chatStorageService.createSession();
    navigate(`/dashboard/chat/${newId}`);
    setShowHistory(false);
  };

  const { language: currentLang } = useLanguage();

  const handleDriveClick = () => {
    setIsAttachMenuOpen(false);
    // Simulating Drive Integration via Link
    const link = prompt("Paste your Google Drive File Link:");
    if (link) {
      setFilePreviews(prev => [...prev, {
        url: link,
        name: "Google Drive File",
        type: "application/vnd.google-apps.file",
        size: 0,
        isLink: true,
        id: Math.random().toString(36).substr(2, 9)
      }]);
      setSelectedFiles(prev => [...prev, { name: "Google Drive File", type: "link" }]);
    }
  };

  const isSendingRef = useRef(false);

  const handleSendMessage = async (e, overrideContent) => {
    if (e) e.preventDefault();

    // Prevent duplicate sends (from voice + form race condition)
    if (isSendingRef.current) return;

    // Use overrideContent if provided (for instant voice sending), otherwise fallback to state
    const contentToSend = typeof overrideContent === 'string' ? overrideContent : inputValue.trim();

    if ((!contentToSend && filePreviews.length === 0) || isLoading) return;

    isSendingRef.current = true;

    let activeSessionId = currentSessionId;
    let isFirstMessage = false;

    // Stop listening if send is clicked (or auto-sent)
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      if (activeSessionId === 'new') {
        activeSessionId = await chatStorageService.createSession();
        isFirstMessage = true;
      }

      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: contentToSend || (filePreviews.length > 0 ? "Analyze these files" : ""),
        timestamp: Date.now(),
        attachments: filePreviews.map(p => ({
          url: p.url,
          name: p.name,
          type: p.type.startsWith('image/') ? 'image' :
            p.type.includes('pdf') ? 'pdf' :
              p.type.includes('word') || p.type.includes('document') ? 'docx' :
                p.type.includes('excel') || p.type.includes('spreadsheet') ? 'xlsx' :
                  p.type.includes('powerpoint') || p.type.includes('presentation') ? 'pptx' : 'file'
        })),
        agentName: activeAgent.agentName || activeAgent.name,
        agentCategory: activeAgent.category
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputValue('');
      handleRemoveFile(); // Clear file after sending
      setIsLoading(true);

      try {
        const title = isFirstMessage ? (userMsg.content ? userMsg.content.slice(0, 30) : 'File Attachment') + '...' : undefined;
        await chatStorageService.saveMessage(activeSessionId, userMsg, title);

        if (isFirstMessage) {
          isNavigatingRef.current = true;
          setCurrentSessionId(activeSessionId);
          navigate(`/dashboard/chat/${activeSessionId}`, { replace: true });
        }

        // Send to AI for response
        const caps = getAgentCapabilities(activeAgent.agentName, activeAgent.category);
        const SYSTEM_INSTRUCTION = `
You are ${activeAgent.agentName || 'AISA'}, an advanced AI assistant powered by A-Series.
${activeAgent.category ? `Your specialization is in ${activeAgent.category}.` : ''}

### FIRST MESSAGE / GREETING INSTRUCTION:
If this is the first message in the conversation (or if the user says hello/start):
1.  **Start with**: "Hello... welcome to ${activeAgent.agentName || 'AISA'}" (Translate this phrase to the user's language).
2.  **Explain**: Describe yourself as a highly specialized AI agent in the ${activeAgent.category || 'General'} category on the A-Series Marketplace.
3.  **Offer Categories**: You MUST present the available agent categories as a list of "Quick Links" to help them get started.
    -   Use the following EXACT Markdown Link format so they are clickable:
    -   *   [Business OS](/dashboard/marketplace?category=Business%20OS)
    -   *   [Data & Intelligence](/dashboard/marketplace?category=Data%20%26%20Intelligence)
    -   *   [Sales & Marketing](/dashboard/marketplace?category=Sales%20%26%20Marketing)
    -   *   [HR & Finance](/dashboard/marketplace?category=HR%20%26%20Finance)
    -   *   [Design & Creative](/dashboard/marketplace?category=Design%20%26%20Creative)
    -   *   [Medical & Health AI](/dashboard/marketplace?category=Medical%20%26%20Health%20AI)
    -   *   [View All Agents](/dashboard/marketplace)
4.  **Language**: Ensure the introduction is in the SAME language as the user's greeting, but keep the Link Targets (URLs) exactly as above.

### CRITICAL LANGUAGE RULE:
**ALWAYS respond in the SAME LANGUAGE as the user's message.**
- If user writes in HINDI (Devanagari or Romanized), respond in HINDI.
- If user writes in ENGLISH, respond in ENGLISH.
- If user mixes languages, prioritize the dominant language.

### RESPONSE FORMATTING RULES (STRICT):
1.  **Structure**: ALWAYS use **Bold Headings** and **Bullet Points**. Avoid long paragraphs.
2.  **Point-wise Answers**: Break down complex topics into simple points.
3.  **Highlights**: Bold key terms and important concepts.
4.  **Summary**: Include a "One-line summary" or "Simple definition" at the start or end where appropriate.
5.  **Emojis**: Use relevant emojis.

${caps.canUploadImages ? `IMAGE ANALYSIS CAPABILITIES:
- You have the ability to see and analyze images provided by the user.
- If the user asks for an image, use Pollinations API: ![Image](https://image.pollinations.ai/prompt/{URL_ENCODED_DESCRIPTION}?nologo=true)` : ''}

${caps.canUploadDocs ? `DOCUMENT ANALYSIS CAPABILITIES:
- You can process and extract text from PDF, Word (Docx), and Excel files provided as attachments.` : ''}

${activeAgent.instructions ? `SPECIFIC AGENT INSTRUCTIONS:
${activeAgent.instructions}` : ''}
`;
        const aiResponseText = await generateChatResponse(messages, userMsg.content, SYSTEM_INSTRUCTION, userMsg.attachments, currentLang);

        const modelMsg = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: aiResponseText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, modelMsg]);
        await chatStorageService.saveMessage(activeSessionId, modelMsg);
      } catch (innerError) {
        console.error("Storage/API Error:", innerError);
        // Even if saving failed, we still have the local state
      }
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error(`Error: ${error.message || "Failed to send message"}`);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat history?')) {
      await chatStorageService.deleteSession(id);
      const data = await chatStorageService.getSessions();
      setSessions(data);
      if (currentSessionId === id) {
        navigate('/dashboard/chat/new');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentCapabilities = (agentName, category) => {
    const name = (agentName || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    // Default: Everything enabled for AISA
    if (name === 'aisa' || !name) {
      return {
        canUploadImages: true,
        canUploadDocs: true,
        canVoice: true,
        canVideo: true,
        canCamera: true
      };
    }

    const caps = {
      canUploadImages: true,
      canUploadDocs: true,
      canVoice: true,
      canVideo: true,
      canCamera: true
    };

    // Specific logic per category/name
    if (cat.includes('hr') || cat.includes('finance') || name.includes('doc') || name.includes('legal')) {
      caps.canVideo = false;
      caps.canCamera = false;
      caps.canUploadImages = false;
    } else if (cat.includes('design') || cat.includes('creative') || name.includes('photo')) {
      caps.canVoice = false;
      caps.canVideo = false;
      caps.canUploadDocs = false;
    } else if (name.includes('voice') || name.includes('call') || name.includes('bot')) {
      caps.canUploadImages = false;
      caps.canUploadDocs = false;
      caps.canCamera = false;
      caps.canVideo = false;
    } else if (cat.includes('medical') || cat.includes('health')) {
      caps.canVideo = false;
      caps.canUploadImages = true;
    }

    return caps;
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }
  };

  const handleImageAction = (action) => {
    if (selectedFiles.length === 0) return;

    let command = '';
    switch (action) {
      case 'remove-bg':
        command = 'Remove the background and clean up this image.';
        break;
      case 'remix':
        command = 'Create a stunning new image based on this attachment. Here are the details: ';
        break;
      case 'enhance':
        command = 'Analyze the attached image and generate a higher quality version of it.';
        break;
      default:
        break;
    }
    setInputValue(command);

    if (action === 'remix') {
      inputRef.current?.focus();
      toast.success("Describe your changes and hit send!");
    } else {
      toast.success(`${action.replace('-', ' ')} processing...`);
      setTimeout(() => handleSendMessage(), 100);
    }
  };
  const inputRef = useRef(null);
  const manualStopRef = useRef(false);
  const isListeningRef = useRef(false);

  // Timer for voice recording (Max 5 minutes)
  useEffect(() => {
    if (isListening) {
      setListeningTime(0);
      isListeningRef.current = true;
      manualStopRef.current = false;
      timerRef.current = setInterval(() => {
        setListeningTime(prev => {
          // Unlimited recording time
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setListeningTime(0);
      isListeningRef.current = false;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const textRef = useRef(inputValue);

  useEffect(() => {
    textRef.current = inputValue;
  }, [inputValue]);

  const handleVoiceInput = () => {
    if (isListening) {
      manualStopRef.current = true;
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    startSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const langMap = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Urdu': 'ur-PK',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Kannada': 'kn-IN',
      'Malayalam': 'ml-IN',
      'Bengali': 'bn-IN',
      'Marathi': 'mr-IN',
      'Mandarin Chinese': 'zh-CN',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Japanese': 'ja-JP',
      'Portuguese': 'pt-BR',
      'Arabic': 'ar-SA',
      'Korean': 'ko-KR',
      'Italian': 'it-IT',
      'Russian': 'ru-RU',
      'Turkish': 'tr-TR',
      'Dutch': 'nl-NL',
      'Swedish': 'sv-SE',
      'Norwegian': 'no-NO',
      'Danish': 'da-DK',
      'Finnish': 'fi-FI',
      'Afrikaans': 'af-ZA',
      'Zulu': 'zu-ZA',
      'Xhosa': 'xh-ZA'
    };

    recognition.lang = langMap[currentLang] || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false; // Better for cross-device stability and prevents duplication
    recognition.maxAlternatives = 1;

    // Capture current input to append to using Ref to avoid stale closures
    let sessionBaseText = textRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      manualStopRef.current = false;
      inputRef.current?.focus();
      if (listeningTime === 0) {
        toast.success(`Microphone On: Speaking in ${currentLang}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart logic for silence/timeout
      if (!manualStopRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) startSpeechRecognition();
        }, 50);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onresult = (event) => {
      let speechToText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        speechToText += event.results[i][0].transcript;
      }

      if (!speechToText) return;

      const lowerTranscript = speechToText.toLowerCase().trim();

      // Extensive triggers for auto-send
      const triggers = [
        'send it', 'send message', 'bhej do', 'yes send it', 'message bhej do',
        'isey bhej do', 'ok send it', 'ok send', 'send bhej do', 'theek hai bhej do',
        'send now', 'please send', 'ji bhejo', 'kar do', 'ok bhej do', 'okay send it'
      ];

      const matchedTrigger = triggers.find(t => lowerTranscript.endsWith(t) || lowerTranscript === t);

      if (matchedTrigger) {
        // Stop listening immediately
        manualStopRef.current = true;
        isListeningRef.current = false;
        recognition.stop();
        setIsListening(false);

        // Remove the trigger phrase (and any trailing punctuation)
        const cleanupRegex = new RegExp(`${matchedTrigger}[\\s.!?]*$`, 'gi');
        let transcriptWithoutTrigger = speechToText.replace(cleanupRegex, '').trim();

        let finalText = (sessionBaseText + (sessionBaseText ? ' ' : '') + transcriptWithoutTrigger).trim();

        toast.success('Voice Command: Sending...');

        // Send IMMEDIATELY then clear everything
        handleSendMessage(null, finalText);

        // Clear input after send
        setInputValue('');
        textRef.current = '';
      } else {
        // Just update the input box as the user speaks
        setInputValue(sessionBaseText + (sessionBaseText ? ' ' : '') + speechToText);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied.");
        setIsListening(false);
        isListeningRef.current = false;
        manualStopRef.current = true;
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, just letting it restart via onend
        return;
      }
      console.error("Speech Error:", event.error);
    };

    recognition.start();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };


  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Feedback State
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsgId, setFeedbackMsgId] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const handlePdfAction = async (action, msg) => {
    setPdfLoadingId(msg.id);
    try {
      const element = document.getElementById(`msg-text-${msg.id}`);
      if (!element) {
        toast.error("Content not found");
        return;
      }

      // Temporarily modify styles for better print capture (e.g. forced light mode)
      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.getElementById(`msg-text-${msg.id}`);
            if (clonedEl) {
              const wrapper = clonedDoc.createElement('div');
              wrapper.style.padding = '60px 70px'; // Professional wide margins
              wrapper.style.backgroundColor = '#ffffff';
              wrapper.style.width = '850px'; // Standard documentation width
              wrapper.style.fontFamily = "'Inter', 'Segoe UI', Arial, sans-serif";

              // No distracting headers/footers on every page, just clean documentation style
              clonedEl.style.color = '#000000';
              clonedEl.style.fontSize = '14px';
              clonedEl.style.lineHeight = '1.7';
              clonedEl.style.whiteSpace = 'normal';

              clonedEl.parentNode.insertBefore(wrapper, clonedEl);
              wrapper.appendChild(clonedEl);

              // Refine all elements for Official Document look
              const allElements = clonedEl.querySelectorAll('*');

              const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}]/gu;

              allElements.forEach(el => {
                el.style.color = '#111827';
                el.style.margin = '0';
                el.style.padding = '0';

                // Remove emojis from text content
                if (el.childNodes.length > 0) {
                  el.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                      node.textContent = node.textContent.replace(emojiRegex, '');
                    }
                  });
                }

                if (el.tagName === 'P') {
                  el.style.marginBottom = '8px'; // Reduced gap
                }
                if (el.tagName === 'UL' || el.tagName === 'OL') {
                  el.style.paddingLeft = '25px';
                  el.style.marginBottom = '12px'; // Reduced gap
                }
                if (el.tagName === 'LI') {
                  el.style.marginBottom = '4px'; // Reduced gap
                  el.style.display = 'list-item';
                }

                // Headers styling matching reference
                if (el.tagName === 'H1') {
                  el.style.fontSize = '24px'; // Slightly smaller h1
                  el.style.fontWeight = '800';
                  el.style.marginTop = '0';
                  el.style.marginBottom = '16px';
                  el.style.color = '#000000';
                }
                if (el.tagName === 'H2') {
                  el.style.fontSize = '18px'; // Slightly smaller h2
                  el.style.fontWeight = '700';
                  el.style.marginTop = '20px'; // Reduced gap
                  el.style.marginBottom = '10px';
                  el.style.borderBottom = '1px solid #e5e7eb';
                  el.style.paddingBottom = '4px';
                }
                if (el.tagName === 'H3') {
                  el.style.fontSize = '15px';
                  el.style.fontWeight = '700';
                  el.style.marginTop = '15px'; // Reduced gap
                  el.style.marginBottom = '8px';
                }

                // Table Styling matching reference
                if (el.tagName === 'TABLE') {
                  el.style.width = '100%';
                  el.style.borderCollapse = 'collapse';
                  el.style.marginTop = '12px';
                  el.style.marginBottom = '12px';
                }
                if (el.tagName === 'TH') {
                  el.style.backgroundColor = '#f9fafb';
                  el.style.border = '1px solid #e5e7eb';
                  el.style.padding = '8px';
                  el.style.textAlign = 'left';
                  el.style.fontWeight = '700';
                  el.style.fontSize = '13px';
                }
                if (el.tagName === 'TD') {
                  el.style.border = '1px solid #e5e7eb';
                  el.style.padding = '6px 8px';
                  el.style.fontSize = '12px';
                }

                if (el.tagName === 'STRONG' || el.tagName === 'B') {
                  el.style.fontWeight = '700';
                }

                if (el.tagName === 'HR') {
                  el.style.border = 'none';
                  el.style.borderTop = '1px solid #e5e7eb';
                  el.style.margin = '20px 0';
                }
              });
            }
          }
        });
      } catch (genError) {
        console.error("html2canvas error:", genError);
        throw new Error("Failed to render PDF content.");
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgProps = pdf.getImageProperties(imgData);
      const margin = 15; // 15mm margin
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentHeightPerPage = pageHeight - (margin * 2);

      let heightLeft = pdfHeight;
      let position = margin;

      // Add first page
      pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
      heightLeft -= contentHeightPerPage;

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = margin - (pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
        heightLeft -= contentHeightPerPage;
      }

      const filename = `aisa-response-${msg.id}.pdf`;

      if (action === 'download') {
        pdf.save(filename);
        toast.success("PDF Downloaded");
      } else if (action === 'open') {
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl, '_blank');
      } else if (action === 'share') {
        const blob = pdf.output('blob');
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'AI Response',
              text: 'Here is the response from A-Series AI.'
            });
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              pdf.save(filename);
              toast("Sharing failed, downloaded instead");
            }
          }
        } else {
          pdf.save(filename);
          toast("Sharing not supported, downloaded instead.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Auto-resize chat input textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height to recount
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleThumbsDown = (msgId) => {
    setFeedbackMsgId(msgId);
    setFeedbackOpen(true);
    setFeedbackCategory([]);
    setFeedbackDetails("");
  };

  const handleThumbsUp = async (msgId) => {
    try {
      await axios.post(apis.feedback, {
        sessionId: sessionId || 'unknown',
        messageId: msgId,
        type: 'thumbs_up'
      });
      toast.success("Thanks for the positive feedback!", {
        icon: '👍',
      });
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const handleShare = async (content) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Assistant Response',
          text: content,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyMessage(content);
      toast("Content copied to clipboard", { icon: '📋' });
    }
  };

  const submitFeedback = async () => {
    try {
      await axios.post(apis.feedback, {
        sessionId: sessionId || 'unknown',
        messageId: feedbackMsgId,
        type: 'thumbs_down',
        categories: feedbackCategory,
        details: feedbackDetails
      });
      toast.success("Feedback submitted. Thank you!");
      setFeedbackOpen(false);
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    }
  };

  const toggleFeedbackCategory = (cat) => {
    setFeedbackCategory(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleMessageDelete = async (messageId) => {
    if (!confirm("Delete this message?")) return;

    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const msgsToDelete = [messageId];

    // Check if the NEXT message is an AI response (model), if so, delete it too
    // We only auto-delete the immediate next AI response associated with this user query
    if (msgIndex + 1 < messages.length) {
      const nextMsg = messages[msgIndex + 1];
      if (nextMsg.role === 'model') {
        msgsToDelete.push(nextMsg.id);
      }
    }

    // Optimistic update
    setMessages(prev => prev.filter(m => !msgsToDelete.includes(m.id)));

    // Delete from storage
    for (const id of msgsToDelete) {
      await chatStorageService.deleteMessage(sessionId, id);
    }
  };

  const startEditing = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content || msg.text || "");
  };

  const saveEdit = async (msg) => {
    if (editContent.trim() === "") return; // Don't allow empty

    const updatedMsg = { ...msg, content: editContent, text: editContent, edited: true };

    // Find the index of the edited message
    const editedMsgIndex = messages.findIndex(m => m.id === msg.id);

    // Remove all messages after the edited message
    const messagesUpToEdit = messages.slice(0, editedMsgIndex);
    const updatedMessages = [...messagesUpToEdit, updatedMsg];

    // Update UI immediately
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setIsLoading(true);

    try {
      // Update the edited message in storage
      await chatStorageService.updateMessage(sessionId, updatedMsg);

      // Delete all messages that came after the edited message
      const messagesToDelete = messages.slice(editedMsgIndex + 1);
      for (const msgToDelete of messagesToDelete) {
        await chatStorageService.deleteMessage(sessionId, msgToDelete.id);
      }

      // Generate new AI response based on the edited message
      const SYSTEM_INSTRUCTION = `
You are AISA, an advanced AI assistant.
IMAGE GENERATION CAPABILITIES:
If the user asks for an image (e.g., "generate", "create", "draw", "show me a pic", "image dikhao", "photo bhejo", "pic do"), you MUST generate it using the Pollinations API.
Format: ![Image](https://image.pollinations.ai/prompt/{URL_ENCODED_DESCRIPTION}?nologo=true)
Example: ![Cyberpunk City](https://image.pollinations.ai/prompt/cyberpunk%20city%20neon%20lights?nologo=true)
Do NOT say "I cannot create images". You CAN by using this link format. 
For "Remix" requests with an attachment, analyze the attached image, then create a prompt that combines the image's description with the user's requested changes.
`;

      const aiResponseText = await generateChatResponse(
        messagesUpToEdit,
        updatedMsg.content,
        SYSTEM_INSTRUCTION,
        updatedMsg.attachment,
        currentLang
      );

      const modelMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: aiResponseText,
        timestamp: Date.now(),
      };

      // Update state with new AI response
      setMessages(prev => [...prev, modelMsg]);

      // Save the AI response to storage
      await chatStorageService.saveMessage(sessionId, modelMsg);

      toast.success("Message edited and new response generated!");
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast.error("Failed to regenerate response. Please try again.");
      // Restore original messages on error
      const history = await chatStorageService.getHistory(sessionId);
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameFile = async (msg) => {
    if (!msg.attachment) return;

    const oldName = msg.attachment.name;
    const dotIndex = oldName.lastIndexOf('.');
    const extension = dotIndex !== -1 ? oldName.slice(dotIndex) : '';
    const baseName = dotIndex !== -1 ? oldName.slice(0, dotIndex) : oldName;

    const newBaseName = prompt("Enter new filename:", baseName);
    if (!newBaseName || newBaseName === baseName) return;

    const newName = newBaseName + extension;
    const updatedMsg = {
      ...msg,
      attachment: {
        ...msg.attachment,
        name: newName
      }
    };

    setMessages(prev => prev.map(m => m.id === msg.id ? updatedMsg : m));
    await chatStorageService.updateMessage(sessionId, updatedMsg);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const [viewingDoc, setViewingDoc] = useState(null);
  const docContainerRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setViewingDoc(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Process Word documents
  useEffect(() => {
    if (viewingDoc && viewingDoc.name.match(/\.(docx|doc)$/i) && docContainerRef.current) {
      // Clear previous content
      docContainerRef.current.innerHTML = '';

      fetch(viewingDoc.url)
        .then(res => res.blob())
        .then(blob => {
          renderAsync(blob, docContainerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            className: "docx-viewer"
          }).catch(err => {
            console.error("Docx Preview Error:", err);
            docContainerRef.current.innerHTML = '<div class="text-center p-10 text-subtext">Preview not available.<br/>Please download to view.</div>';
          });
        });
    }
  }, [viewingDoc]);

  // Process Excel documents
  useEffect(() => {
    if (viewingDoc && viewingDoc.name.match(/\.(xls|xlsx|csv)$/i)) {
      setExcelHTML(null); // Reset
      fetch(viewingDoc.url)
        .then(res => res.arrayBuffer())
        .then(ab => {
          const wb = XLSX.read(ab, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(ws, { id: "excel-preview", editable: false });
          setExcelHTML(html);
        })
        .catch(err => {
          console.error("Excel Preview Error:", err);
          setExcelHTML('<div class="text-center p-10 text-red-500">Failed to load Excel preview.</div>');
        });
    }
  }, [viewingDoc]);

  // Process Text/Code documents
  useEffect(() => {
    // Check if handled by other specific viewers
    const isSpecial = viewingDoc?.name.match(/\.(docx|doc|xls|xlsx|csv|pdf|mp4|webm|ogg|mov|mp3|wav|m4a|jpg|jpeg|png|gif|webp|bmp|svg)$/i) || viewingDoc?.url.startsWith('data:image/');

    if (viewingDoc && !isSpecial) {
      setTextPreview(null);
      fetch(viewingDoc.url)
        .then(res => res.text())
        .then(text => {
          if (text.length > 5000000) {
            setTextPreview(text.substring(0, 5000000) + "\n\n... (File truncated due to size)");
          } else {
            setTextPreview(text);
          }
        })
        .catch(err => {
          console.error("Text Preview Error:", err);
          setTextPreview("Failed to load text content.");
        });
    }
  }, [viewingDoc]);

  return (
    <div className="flex h-full w-full bg-secondary relative overflow-hidden">

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-maintext truncate max-w-md">{viewingDoc.name}</h3>
                    <p className="text-xs text-subtext">
                      {viewingDoc.type === 'image' || viewingDoc.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
                        ? 'Image Preview'
                        : 'File Preview'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(viewingDoc.url, viewingDoc.name)}
                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-subtext"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-subtext"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative flex items-center justify-center overflow-hidden">
                {viewingDoc.type === 'image' || viewingDoc.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || viewingDoc.url.startsWith('data:image/') ? (
                  <img
                    src={viewingDoc.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : viewingDoc.name.match(/\.(docx|doc)$/i) ? (
                  <div
                    ref={docContainerRef}
                    className="bg-gray-100 w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center py-8"
                  />
                ) : viewingDoc.name.match(/\.(xls|xlsx|csv)$/i) ? (
                  <div
                    className="bg-white w-full h-full overflow-auto p-4 custom-scrollbar text-black text-sm"
                    dangerouslySetInnerHTML={{ __html: excelHTML || '<div class="flex items-center justify-center h-full"><div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>' }}
                  />
                ) : viewingDoc.name.endsWith('.pdf') || viewingDoc.url.startsWith('data:application/pdf') ? (
                  <iframe
                    src={viewingDoc.url}
                    className="w-full h-full border-0"
                    title="Document Viewer"
                  />
                ) : viewingDoc.name.match(/\.(mp4|webm|ogg|mov)$/i) || viewingDoc.type.startsWith('video/') ? (
                  <video controls className="max-w-full max-h-full rounded-lg shadow-lg" src={viewingDoc.url}>
                    Your browser does not support the video tag.
                  </video>
                ) : viewingDoc.name.match(/\.(mp3|wav|ogg|m4a)$/i) || viewingDoc.type.startsWith('audio/') ? (
                  <div className="p-10 bg-surface rounded-2xl flex flex-col items-center gap-6 shadow-md border border-border">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-slow">
                      <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center">
                        <Mic className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg mb-1">{viewingDoc.name}</h3>
                      <p className="text-xs text-subtext">Audio File Player</p>
                    </div>
                    <audio controls className="w-full min-w-[300px]" src={viewingDoc.url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#1e1e1e] p-0 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#cccccc] uppercase tracking-wider">
                          {viewingDoc.name.match(/\.(rar|zip|exe|dll|bin|iso|7z)$/i) ? 'BINARY CONTENT' : 'CODE READER'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0e639c] text-white font-mono shadow-sm">
                        {viewingDoc.name.split('.').pop().toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-4">
                      <code className="text-xs font-mono whitespace-pre-wrap text-[#9cdcfe] break-all leading-relaxed tab-4 block">
                        {textPreview || "Reading file stream..."}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Editor */}
      <AnimatePresence>
        {isEditingImage && selectedFile && (
          <ImageEditor
            file={selectedFile}
            onClose={() => setIsEditingImage(false)}
            onSave={(newFile) => {
              processFile(newFile);
              setIsEditingImage(false);
              toast.success("Image updated!");
            }}
          />
        )}
      </AnimatePresence>

      <ModelSelector
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        toolType={selectedToolType}
        currentModel={selectedToolType ? toolModels[selectedToolType] : 'gemini-flash'}
        onSelectModel={handleModelSelect}
        pricing={TOOL_PRICING}
      />

      <div
        className={`
          flex flex-col flex-shrink-0 bg-surface border-r border-border
          transition-all duration-300 ease-in-out
          
          /* Mobile: Absolute overlay */
          absolute inset-y-0 left-0 z-50 w-full sm:w-72
          ${showHistory ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}

          /* Desktop: Relative flow, animate width instead of transform */
          lg:relative lg:inset-auto lg:shadow-none lg:translate-x-0
          ${showHistory ? 'lg:w-72' : 'lg:w-0 lg:border-none lg:overflow-hidden'}
        `}
      >
        <div className="p-3">
          <div className="flex justify-between items-center mb-3 lg:hidden">
            <span className="font-bold text-lg text-maintext">History</span>
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 hover:bg-secondary rounded-full text-subtext transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full bg-primary hover:opacity-90 text-white font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20 text-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <h3 className="px-4 py-2 text-xs font-semibold text-subtext uppercase tracking-wider">
            Recent
          </h3>

          {sessions.map((session) => (
            <div key={session.sessionId} className="group relative px-2">
              <button
                onClick={() => navigate(`/dashboard/chat/${session.sessionId}`)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors truncate
                  ${currentSessionId === session.sessionId
                    ? 'bg-card text-primary shadow-sm border border-border'
                    : 'text-subtext hover:bg-card hover:text-maintext'
                  }
                `}
              >
                <div className="font-medium truncate pr-6">{session.title}</div>
                <div className="text-[10px] text-subtext/70">
                  {new Date(session.lastModified).toLocaleDateString()}
                </div>
              </button>
              <button
                onClick={(e) => handleDeleteSession(e, session.sessionId)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-subtext hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Chat"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="px-4 text-xs text-subtext italic">No recent chats</div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div
        className="flex-1 flex flex-col relative bg-secondary w-full min-w-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none">
            <Cloud className="w-16 h-16 text-primary mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-primary">Drop to Upload</h3>
          </div>
        )}

        {/* Header */}
        <div className="h-12 md:h-14 border-b border-border flex items-center justify-between px-3 md:px-4 bg-secondary z-10 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">

            <button
              className="p-2 -ml-2 text-subtext hover:text-maintext shrink-0"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-subtext min-w-0">
              <span className="text-sm hidden sm:inline shrink-0">Chatting with:</span>
              <Menu as="div" className="relative inline-block text-left min-w-0">
                <Menu.Button className="flex items-center gap-2 text-maintext bg-surface px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:bg-secondary transition-colors min-w-0 w-full">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
                    <img
                      src={activeAgent.avatar || (activeAgent.agentName === 'AISA' ? '/AGENTS_IMG/AISA.png' : '/AGENTS_IMG/AIBOT.png')}
                      alt=""
                      className="w-4 h-4 rounded-sm object-cover"
                      onError={(e) => { e.target.src = '/AGENTS_IMG/AISA.png' }}
                    />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {activeAgent.agentName || activeAgent.name} <sup>TM</sup>
                  </span>
                  <ChevronDown className="w-3 h-3 text-subtext shrink-0" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-border rounded-xl bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-border">
                    <div className="px-1 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {userAgents.map((agent, idx) => (
                        <Menu.Item key={idx}>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setActiveAgent(agent);
                                toast.success(`Switched to ${agent.agentName || agent.name}`);
                              }}
                              className={`${active ? 'bg-primary text-white' : 'text-maintext'
                                } group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium gap-3 transition-colors`}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-primary/10'}`}>
                                <img
                                  src={agent.avatar || (agent.agentName === 'AISA' ? '/AGENTS_IMG/AISA.png' : '/AGENTS_IMG/AIBOT.png')}
                                  alt=""
                                  className="w-4 h-4 rounded-sm object-cover"
                                  onError={(e) => { e.target.src = '/AGENTS_IMG/AISA.png' }}
                                />
                              </div>
                              <span className="truncate">{agent.agentName || agent.name}</span>
                              {activeAgent.agentName === agent.agentName && (
                                <Check className={`w-3 h-3 ml-auto ${active ? 'text-white' : 'text-primary'}`} />
                              )}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* <button className="flex items-center gap-2 text-subtext hover:text-maintext text-sm">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Device</span>
            </button> */}

          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 space-y-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
              <h2 className="text-xl font-medium text-maintext mb-2">
                How can I help you today?
              </h2>
              <p className="text-subtext text-sm sm:text-base">
                Start a conversation with your AI agent.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group relative flex items-start gap-2 md:gap-3 max-w-4xl mx-auto cursor-pointer ${msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                >
                  {/* Actions Menu (Always visible for discoverability) */}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                      ? 'bg-primary'
                      : 'bg-surface border border-border'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  <div
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                      } max-w-[85%] sm:max-w-[80%]`}
                  >
                    <div
                      className={`group/bubble relative px-3 py-1.5 md:px-4 md:py-2 rounded-2xl text-sm leading-normal whitespace-pre-wrap break-words shadow-sm w-fit max-w-full ${msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface border border-border text-maintext rounded-tl-none'
                        }`}
                    >

                      {/* Attachment Display */}
                      {(msg.attachments || msg.attachment) && (
                        <div className="flex flex-col gap-3 mb-3 mt-1">
                          {(msg.attachments || (msg.attachment ? [msg.attachment] : [])).map((att, idx) => (
                            <div key={idx} className="w-full">
                              {att.type === 'image' ? (
                                <div
                                  className="relative group/image overflow-hidden rounded-xl border border-white/20 shadow-lg transition-all hover:scale-[1.01] cursor-pointer max-w-[320px]"
                                  onClick={() => setViewingDoc(att)}
                                >
                                  <img
                                    src={att.url}
                                    alt="Attachment"
                                    className="w-full h-auto max-h-[400px] object-contain bg-black/5"
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(att.url, att.name);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-all hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${msg.role === 'user' ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-secondary/30 border-border hover:bg-secondary/50'}`}>
                                  <div
                                    className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer p-0.5 rounded-lg"
                                    onClick={() => setViewingDoc(att)}
                                  >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${(() => {
                                      const name = (att.name || '').toLowerCase();
                                      if (msg.role === 'user') return 'bg-white shadow-sm';
                                      if (name.endsWith('.pdf')) return 'bg-red-50 dark:bg-red-900/20';
                                      if (name.match(/\.(doc|docx)$/)) return 'bg-blue-50 dark:bg-blue-900/20';
                                      if (name.match(/\.(xls|xlsx|csv)$/)) return 'bg-emerald-50 dark:bg-emerald-900/20';
                                      if (name.match(/\.(ppt|pptx)$/)) return 'bg-orange-50 dark:bg-orange-900/20';
                                      return 'bg-secondary';
                                    })()}`}>
                                      {(() => {
                                        const name = (att.name || '').toLowerCase();
                                        const baseClass = "w-6 h-6";
                                        if (name.match(/\.(xls|xlsx|csv)$/)) return <FileSpreadsheet className={`${baseClass} text-emerald-600`} />;
                                        if (name.match(/\.(ppt|pptx)$/)) return <Presentation className={`${baseClass} text-orange-600`} />;
                                        if (name.endsWith('.pdf')) return <FileText className={`${baseClass} text-red-600`} />;
                                        if (name.match(/\.(doc|docx)$/)) return <File className={`${baseClass} text-blue-600`} />;
                                        return <File className={`${baseClass} text-primary`} />;
                                      })()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate text-xs mb-0.5">{att.name || 'File'}</p>
                                      <p className="text-[10px] opacity-70 uppercase tracking-tight font-medium">
                                        {(() => {
                                          const name = (att.name || '').toLowerCase();
                                          if (name.endsWith('.pdf')) return 'PDF • Preview';
                                          if (name.match(/\.(doc|docx)$/)) return 'WORD • Preview';
                                          if (name.match(/\.(xls|xlsx|csv)$/)) return 'EXCEL';
                                          if (name.match(/\.(ppt|pptx)$/)) return 'SLIDES';
                                          return 'DOCUMENT';
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(att.url, att.name);
                                    }}
                                    className={`p-2 rounded-lg transition-colors shrink-0 ${msg.role === 'user' ? 'hover:bg-white/20 text-white' : 'hover:bg-primary/10 text-primary'}`}
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-3 min-w-[200px] w-full">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-xl p-3 text-sm focus:outline-none resize-none border border-white/20 placeholder-white/50"
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit(msg);
                              }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="flex gap-3 justify-end items-center">
                            <button
                              onClick={cancelEdit}
                              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msg)}
                              className="bg-white text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors shadow-sm"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.content && (
                          <div id={`msg-text-${msg.id}`} className={`max-w-full break-words text-sm md:text-base leading-normal whitespace-normal ${msg.role === 'user' ? 'text-white' : 'text-maintext'}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href, children }) => {
                                  const isInternal = href && href.startsWith('/');
                                  return (
                                    <a
                                      href={href}
                                      onClick={(e) => {
                                        if (isInternal) {
                                          e.preventDefault();
                                          navigate(href);
                                        }
                                      }}
                                      className="text-primary hover:underline font-bold cursor-pointer"
                                      target={isInternal ? "_self" : "_blank"}
                                      rel={isInternal ? "" : "noopener noreferrer"}
                                    >
                                      {children}
                                    </a>
                                  );
                                },
                                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1.5 marker:text-subtext">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1.5 marker:text-subtext">{children}</ol>,
                                li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
                                h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 block">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-2 block">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xs font-bold mb-1 mt-1.5 block">{children}</h3>,
                                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                                code: ({ node, inline, className, children, ...props }) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const lang = match ? match[1] : '';

                                  if (!inline && match) {
                                    return (
                                      <div className="rounded-xl overflow-hidden my-2 border border-border bg-[#1e1e1e] shadow-md w-full max-w-full">
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
                                          <span className="text-xs font-mono text-gray-300 lowercase">{lang}</span>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                              toast.success("Code copied!");
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy code
                                          </button>
                                        </div>
                                        <div className="p-4 overflow-x-auto custom-scrollbar bg-[#1e1e1e]">
                                          <code className={`${className} font-mono text-sm leading-relaxed text-[#d4d4d4] block min-w-full`} {...props}>
                                            {children}
                                          </code>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-primary font-bold mx-0.5" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                img: ({ node, ...props }) => (
                                  <div className="relative group/generated mt-4 mb-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all hover:scale-[1.01] bg-surface/50 backdrop-blur-sm">
                                    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center opacity-0 group-hover/generated:opacity-100 transition-opacity">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Generated Asset</span>
                                      </div>
                                    </div>
                                    <img
                                      {...props}
                                      className="w-full max-w-full h-auto rounded-xl bg-black/5"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.src = 'https://placehold.co/600x400?text=Image+Generating...';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/generated:opacity-100 transition-opacity pointer-events-none" />
                                    <button
                                      onClick={() => handleDownload(props.src, 'aisa-generated.png')}
                                      className="absolute bottom-3 right-3 p-2.5 bg-primary text-white rounded-xl opacity-0 group-hover/generated:opacity-100 transition-all hover:bg-primary/90 shadow-lg border border-white/20 scale-90 group-hover/generated:scale-100"
                                      title="Download High-Res"
                                    >
                                      <div className="flex items-center gap-2 px-1">
                                        <Download className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase">Download</span>
                                      </div>
                                    </button>
                                  </div>
                                )
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )
                      )}

                      {/* AI Feedback Actions */}
                      {msg.role !== 'user' && (
                        <div className="mt-1 pt-2 border-t border-transparent">
                          {(() => {
                            // Detect if the AI response contains Hindi (Devanagari script)
                            const isHindiContent = /[\u0900-\u097F]/.test(msg.content);
                            const prompts = isHindiContent ? FEEDBACK_PROMPTS.hi : FEEDBACK_PROMPTS.en;
                            const promptIndex = (msg.id.toString().charCodeAt(msg.id.toString().length - 1) || 0) % prompts.length;
                            return (
                              <p className="text-sm text-maintext mb-2 flex items-center gap-1">
                                {prompts[promptIndex]}
                                <span className="text-base">😊</span>
                              </p>
                            );
                          })()}
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleCopyMessage(msg.content)}
                              className="text-subtext hover:text-maintext transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleThumbsUp(msg.id)}
                              className="text-subtext hover:text-primary transition-colors"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleThumbsDown(msg.id)}
                              className="text-subtext hover:text-red-500 transition-colors"
                              title="Not Helpful"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShare(msg.content)}
                              className="text-subtext hover:text-primary transition-colors"
                              title="Share Text"
                            >
                              <Share className="w-4 h-4" />
                            </button>

                            {/* PDF Menu */}
                            <Menu as="div" className="relative inline-block text-left">
                              <Menu.Button className="text-subtext hover:text-red-500 transition-colors flex items-center" disabled={pdfLoadingId === msg.id}>
                                {pdfLoadingId === msg.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </Menu.Button>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute bottom-full left-0 mb-2 w-36 origin-bottom-left divide-y divide-border rounded-xl bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                                  <div className="px-1 py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handlePdfAction('open', msg)}
                                          className={`${active ? 'bg-primary text-white' : 'text-maintext'
                                            } group flex w-full items-center rounded-md px-2 py-2 text-xs font-medium`}
                                        >
                                          Open PDF
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handlePdfAction('download', msg)}
                                          className={`${active ? 'bg-primary text-white' : 'text-maintext'
                                            } group flex w-full items-center rounded-md px-2 py-2 text-xs font-medium`}
                                        >
                                          Download
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handlePdfAction('share', msg)}
                                          className={`${active ? 'bg-primary text-white' : 'text-maintext'
                                            } group flex w-full items-center rounded-md px-2 py-2 text-xs font-medium`}
                                        >
                                          Share PDF
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-subtext mt-0 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Hover Actions - User Only (AI has footer) */}
                  {msg.role === 'user' && (
                    <div className={`flex items-center gap-1 transition-opacity duration-200 self-start mt-2 mr-0 flex-row-reverse ${activeMessageId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button
                        onClick={() => handleCopyMessage(msg.content || msg.text)}
                        className="p-1.5 text-subtext hover:text-primary hover:bg-surface rounded-full transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {!msg.attachment && (
                        <button
                          onClick={() => startEditing(msg)}
                          className="p-1.5 text-subtext hover:text-primary hover:bg-surface rounded-full transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {msg.attachment && (
                        <button
                          onClick={() => handleRenameFile(msg)}
                          className="p-1.5 text-subtext hover:text-primary hover:bg-surface rounded-full transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleMessageDelete(msg.id)}
                        className="p-1.5 text-subtext hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-4 max-w-4xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <Loader />

                  </div>
                  <div className="px-5 py-3 rounded-2xl rounded-tl-none bg-surface border border-border flex items-center gap-2">
                    <span
                      className="w-2 h-2 bg-subtext/50 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-subtext/50 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-subtext/50 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></span>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 md:p-4 shrink-0 bg-secondary border-t border-border sm:border-t-0">
          <div className="max-w-4xl mx-auto relative">

            {/* File Preview Area */}
            {filePreviews.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-4 px-2 overflow-x-auto custom-scrollbar no-scrollbar flex gap-3 pb-2 z-20 pointer-events-auto">
                {filePreviews.map((preview) => (
                  <div
                    key={preview.id}
                    className="relative shrink-0 w-64 md:w-72 bg-surface/95 dark:bg-zinc-900/95 border border-border/50 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-300 ring-1 ring-black/5"
                  >
                    <div className="relative group shrink-0">
                      {preview.type.startsWith('image/') ? (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-border/50 bg-black/5">
                          <img src={preview.url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
                          <FileText className="w-7 h-7 text-primary" />
                        </div>
                      )}

                      <div className="absolute -top-2 -right-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(preview.id)}
                          className="p-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-surface"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 py-1">
                      <p className="text-sm font-semibold text-maintext truncate pr-1">{preview.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-lg uppercase tracking-wider font-bold">
                          {preview.type.split('/')[1]?.split('-')[0] || 'FILE'}
                        </span>
                        <span className="text-[10px] text-subtext font-medium">
                          {(preview.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <input
                id="file-upload"
                type="file"
                ref={uploadInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <input
                id="drive-upload"
                type="file"
                ref={driveInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <input
                id="photos-upload"
                type="file"
                ref={photosInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*"
              />
              <input
                id="camera-upload"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                capture="environment"
              />

              <AnimatePresence>
                {isAttachMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    ref={menuRef}
                    className="absolute bottom-full left-0 mb-3 w-60 bg-surface border border-border/50 rounded-2xl shadow-xl overflow-hidden z-30 backdrop-blur-md ring-1 ring-black/5"
                  >
                    <div className="p-1.5 space-y-0.5">
                      {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canCamera && (
                        <label
                          htmlFor="camera-upload"
                          onClick={() => setTimeout(() => setIsAttachMenuOpen(false), 500)}
                          className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-primary/5 rounded-xl transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors shrink-0">
                            <Camera className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-maintext group-hover:text-primary transition-colors">Camera & Scan</span>
                            <div className="text-xs text-subtext">{TOOL_PRICING.image.models.find(m => m.id === toolModels.image)?.name}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedToolType('image');
                              setIsModelSelectorOpen(true);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Change
                          </button>
                        </label>
                      )}

                      {(getAgentCapabilities(activeAgent.agentName, activeAgent.category).canUploadFiles || true) && (
                        <label
                          htmlFor="file-upload"
                          onClick={() => setIsAttachMenuOpen(false)}
                          className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-primary/5 rounded-xl transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors shrink-0">
                            <Paperclip className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-medium text-maintext group-hover:text-primary transition-colors">Upload files</span>
                        </label>
                      )}

                      {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canUploadDocs && (
                        <label
                          htmlFor="drive-upload"
                          onClick={() => setIsAttachMenuOpen(false)}
                          className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-primary/5 rounded-xl transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors shrink-0">
                            <Cloud className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-maintext group-hover:text-primary transition-colors">Add from Drive</span>
                            <div className="text-xs text-subtext">{TOOL_PRICING.document.models.find(m => m.id === toolModels.document)?.name}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedToolType('document');
                              setIsModelSelectorOpen(true);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Change
                          </button>
                        </label>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                ref={attachBtnRef}
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className={`p-3 sm:p-4 rounded-full border border-primary bg-primary text-white transition-all duration-300 shadow-lg shadow-primary/20 shrink-0 flex items-center justify-center hover:opacity-90
                  ${isAttachMenuOpen ? 'rotate-45' : ''}`}
                title="Add to chat"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask AISA..."
                  rows={1}
                  className={`w-full bg-surface border border-border rounded-2xl py-2 md:py-3 pl-4 sm:pl-5 text-sm md:text-base text-maintext placeholder-subtext focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all resize-none overflow-y-auto custom-scrollbar ${inputValue.trim() ? 'pr-20 md:pr-24' : 'pr-32 md:pr-40'}`}
                  style={{ minHeight: '40px', maxHeight: '150px' }}
                />
                <div className="absolute right-2 inset-y-0 flex items-center gap-0 sm:gap-1 z-10">
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors group"
                      onClick={handleVoiceInput}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Recording...</span>
                    </motion.div>
                  )}
                  {!isListening && (
                    <>
                      {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canVideo && !inputValue.trim() && (
                        <button
                          type="button"
                          onClick={() => setIsLiveMode(true)}
                          className="p-2 sm:p-2.5 rounded-full text-primary hover:bg-primary/10 hover:border-primary/20 transition-all flex items-center justify-center border border-transparent"
                          title="Live Video Call"
                        >
                          <Video className="w-5 h-5" />
                        </button>
                      )}

                      {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canVoice && (
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          className={`p-2 sm:p-2.5 rounded-full transition-all flex items-center justify-center border border-transparent ${isListening ? 'bg-primary text-white animate-pulse shadow-md shadow-primary/30' : 'text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                          title="Voice Input"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={(!inputValue.trim() && filePreviews.length === 0) || isLoading}
                    className="p-2 sm:p-2.5 rounded-full bg-primary text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Live AI Modal */}
      <AnimatePresence>
        {isLiveMode && (
          <LiveAI
            onClose={() => setIsLiveMode(false)}
            language={currentLang}
          />
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <Transition appear show={feedbackOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setFeedbackOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface p-6 text-left align-middle shadow-xl transition-all border border-border">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-maintext flex justify-between items-center"
                  >
                    Share feedback
                    <button onClick={() => setFeedbackOpen(false)} className="text-subtext hover:text-maintext">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Title>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Incorrect or incomplete", "Not what I asked for", "Slow or buggy", "Style or tone", "Safety or legal concern", "Other"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleFeedbackCategory(cat)}
                        className={`text-xs px-3 py-2 rounded-full border transition-colors ${feedbackCategory.includes(cat)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-transparent text-subtext border-border hover:border-maintext'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <textarea
                      className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-3 text-sm focus:outline-none border border-transparent focus:border-border text-maintext placeholder-subtext resize-none"
                      rows={3}
                      placeholder="Share details (optional)"
                      value={feedbackDetails}
                      onChange={(e) => setFeedbackDetails(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 text-[10px] text-subtext leading-tight">
                    Your conversation will be included with your feedback to help improve the AI.
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/75"
                      onClick={submitFeedback}
                    >
                      Submit
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Chat;