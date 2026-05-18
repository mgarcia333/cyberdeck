"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

export default function CyberdeckConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dynamic Overlays
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // System status and log feed state
  const [status, setStatus] = useState({
    status: 'OFFLINE',
    cpuUsage: '0.0%',
    memoryUsage: '0 MB',
    uptime: 0,
    activeMacrosCount: 0,
    wakeWord: 'cyberdeck',
    assistantName: 'Cyberdeck',
    provider: 'gemini'
  });
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, time: '12:00:00', type: 'SYS', text: 'Cyberdeck Cores offline. Waiting for sync...' }
  ]);

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      assistantName: 'Cyberdeck',
      wakeWord: 'cyberdeck',
      ttsVoice: 'Default',
      ttsSpeed: 1.0,
      ttsVolume: 100,
      ttsPitch: 1.0,
      llmProvider: 'gemini',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      systemInstruction: 'You are Cyberdeck, a powerful Y2K retro AI system assistant...',
      safeMode: false,
      customCommands: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customCommands'
  });

  // Watch selected provider to customize placeholder texts
  const selectedProvider = watch('llmProvider');

  // Fetch speech synthesis voices from browser APIs
  useEffect(() => {
    const fetchVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices.map(v => v.name));
        }
      }
    };
    
    fetchVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  // Poll system status API from the local Electron server
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          
          // Inject dynamic log entries dynamically to simulate a real-time monitor
          setSystemLogs(prev => {
            const newLogs = [...prev];
            const timeString = new Date().toLocaleTimeString();
            
            if (newLogs.length === 1 && newLogs[0].text.includes('offline')) {
              newLogs.shift();
              newLogs.push({ id: Date.now(), time: timeString, type: 'SYS', text: `Cyberdeck Core status: ${data.status}` });
              newLogs.push({ id: Date.now() + 1, time: timeString, type: 'SYS', text: `Core Engine linked on wake word "${data.wakeWord.toUpperCase()}"` });
              newLogs.push({ id: Date.now() + 2, time: timeString, type: 'LLM', text: `LLM Cognitive Provider set to ${data.provider.toUpperCase()}` });
            }
            
            // Randomly insert slight diagnostic events to make the feed look incredibly organic and alive
            if (Math.random() > 0.75) {
              const events = [
                { type: 'SYS', text: `Background voice synthesis active.` },
                { type: 'IO', text: `Polling active telemetry metrics (CPU: ${data.cpuUsage}, RAM: ${data.memoryUsage})` },
                { type: 'CMD', text: `${data.activeMacrosCount} custom trigger macros parsed in memory.` }
              ];
              const selectedEvent = events[Math.floor(Math.random() * events.length)];
              newLogs.push({ id: Date.now(), time: timeString, type: selectedEvent.type, text: selectedEvent.text });
            }
            
            // Keep logs capped at 12 entries
            if (newLogs.length > 12) newLogs.shift();
            return newLogs;
          });
        }
      } catch (err) {
        console.warn('Telemetry offline:', err.message);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load config.json on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to fetch config');
        const data = await res.json();
        
        if (!data.customCommands) {
          data.customCommands = [];
        }
        
        // Load with safe defaults if missing in the active json
        const mergedData = {
          assistantName: data.assistantName || 'Cyberdeck',
          wakeWord: data.wakeWord || 'cyberdeck',
          ttsVoice: data.ttsVoice || 'Default',
          ttsSpeed: data.ttsSpeed ?? 1.0,
          ttsVolume: data.ttsVolume ?? 100,
          ttsPitch: data.ttsPitch ?? 1.0,
          llmProvider: data.llmProvider || 'gemini',
          apiKey: data.apiKey || '',
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 2048,
          systemInstruction: data.systemInstruction || 'You are Cyberdeck, a powerful Y2K retro AI system assistant...',
          safeMode: data.safeMode ?? false,
          customCommands: data.customCommands
        };
        reset(mergedData);
      } catch (err) {
        console.error('Error loading config:', err);
        setSnackbar({
          open: true,
          message: 'Error loading configuration file. Using defaults.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save config');
      }

      const updatedData = await res.json();
      reset(updatedData);
      setSnackbar({
        open: true,
        message: 'Configuration applied and hot-reloaded successfully!',
        severity: 'success'
      });
      
      // Inject save event in log feed
      setSystemLogs(prev => [
        ...prev,
        { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'SYS', text: 'New configuration parameters committed and hot-swapped.' }
      ]);
    } catch (err) {
      console.error('Error saving config:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Error saving configuration.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper to add a new custom command macro row
  const handleAddMacro = () => {
    append({ trigger: '', actionType: 'open_url', payload: '' });
  };

  // Trigger test-macro execution on the server directly
  const handleTestMacro = async (actionType, payload) => {
    if (!payload) {
      setSnackbar({ open: true, message: 'Macro payload cannot be empty to test!', severity: 'error' });
      return;
    }
    
    setSnackbar({ open: true, message: 'Sending test macro command...', severity: 'success' });
    try {
      const res = await fetch('/api/test-macro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, payload })
      });
      const data = await res.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: `Success: ${data.result || 'Executed successfully.'}`,
          severity: 'success'
        });
        
        // Log in the CRT monitor feed
        setSystemLogs(prev => [
          ...prev,
          { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'CMD', text: `Simulated Macro execution: ${actionType} -> ${payload}` }
        ]);
      } else {
        throw new Error(data.error || 'Execution failed.');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Macro execution failed: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Trigger hot core restart
  const handleRestartCores = async () => {
    setSnackbar({ open: true, message: 'Rebooting Cyberdeck Cores...', severity: 'success' });
    try {
      const res = await fetch('/api/restart', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        
        setSystemLogs(prev => [
          ...prev,
          { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'SYS', text: 'Manual engine core reboot cycle completed.' }
        ]);
      } else {
        throw new Error('Reboot failed.');
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Hard wipe to factory defaults
  const handleFactoryReset = () => {
    const confirm = window.confirm("WARNING: Are you absolutely sure you want to restore factory default configuration?");
    if (!confirm) return;

    const factoryDefaults = {
      assistantName: 'Cyberdeck',
      wakeWord: 'cyberdeck',
      ttsVoice: 'Default',
      ttsSpeed: 1.0,
      ttsVolume: 100,
      ttsPitch: 1.0,
      llmProvider: 'gemini',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      systemInstruction: 'You are Cyberdeck, a powerful Y2K retro AI system assistant...',
      safeMode: false,
      customCommands: []
    };

    reset(factoryDefaults);
    onSubmit(factoryDefaults);
    setSnackbar({ open: true, message: 'Factory default configuration restored!', severity: 'success' });
  };

  // Format seconds to hh:mm:ss
  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-primary">
        <div className="w-16 h-16 border-4 border-secondary-fixed border-t-transparent rounded-full animate-spin"></div>
        <h2 className="font-headline-sm text-headline-sm mt-6 uppercase tracking-wider text-secondary-fixed">
          Synchronizing Cyberdeck Cores...
        </h2>
      </div>
    );
  }

  // Live filter custom command macros by trigger phrase
  const filteredFields = fields.map((field, index) => ({ field, index })).filter(({ field }) => 
    field.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.payload.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-screen overflow-hidden flex flex-col bg-background text-on-surface font-body-md antialiased select-none">
      
      {/* 🔔 Glassmorphic Floating Notification Tray */}
      {snackbar.open && (
        <div className={`fixed top-20 right-gutter z-50 flex items-center gap-unit px-gutter py-3 rounded-DEFAULT border ${
          snackbar.severity === 'success'
            ? 'bg-secondary-container/20 border-secondary-fixed text-secondary-fixed'
            : 'bg-error-container/20 border-error text-error'
        } shadow-lg backdrop-blur-md transition-all duration-300`}>
          <span className="material-symbols-outlined">
            {snackbar.severity === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-body-md text-body-md font-semibold">{snackbar.message}</span>
          <button type="button" onClick={handleSnackbarClose} className="ml-gutter hover:opacity-80">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ❔ Skeuomorphic CRT Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-gutter">
          <div className="bg-surface-container border border-outline-variant rounded-lg max-w-lg w-full overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary-fixed"></div>
            
            <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">help_outline</span>
                Skeuomorphic Diagnostic Manual
              </h3>
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-gutter font-body-md text-body-md space-y-4 max-h-[400px] overflow-y-auto">
              <p className="text-on-surface-variant">
                Cyberdeck is a native Windows system assistant powered by offline vocal command matching and state-of-the-art cognitive cloud models.
              </p>
              
              <h4 className="font-bold text-secondary-fixed uppercase text-sm border-b border-outline-variant pb-1">Voice Activation Rules</h4>
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                <li>Double click <code className="text-primary">Cyberdeck.exe</code> to initialize the listener.</li>
                <li>Speak aloud the wake word: <code className="text-primary">"{status.wakeWord.toUpperCase()}"</code>.</li>
                <li>When the floating CRT visualizer starts breathing, speak your query or macro trigger.</li>
              </ul>

              <h4 className="font-bold text-secondary-fixed uppercase text-sm border-b border-outline-variant pb-1">Sample Vocal Commands</h4>
              <div className="bg-black/50 p-3 rounded font-data-num text-xs space-y-2 text-primary border border-outline-variant/30">
                <p>🗣️ *"{status.wakeWord}, open google"* → Launches native web browser.</p>
                <p>🗣️ *"{status.wakeWord}, list directory contents"* → Executes custom command triggers.</p>
                <p>🗣️ *"{status.wakeWord}, who created you?"* → Redirects query to Google Gemini/Groq LLM.</p>
              </div>

              <p className="text-xs text-on-surface-variant italic">
                Tip: You can test macros immediately in this panel on the <strong className="text-secondary-fixed">Macros Tab</strong> by clicking the play icon <strong className="text-secondary-fixed">▶</strong>.
              </p>
            </div>

            <div className="p-gutter border-t border-outline-variant flex justify-end bg-surface-container-lowest">
              <button 
                type="button" 
                onClick={() => setShowHelpModal(false)}
                className="bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-4 py-2 rounded font-bold uppercase hover:opacity-90 transition-opacity"
              >
                Acknowledge manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TopNavBar */}
      <nav className="bg-surface-container border-b border-outline-variant flex justify-between items-center w-full px-gutter h-16 z-40 shrink-0">
        <div className="flex items-center gap-gutter">
          <span className="font-headline-md text-headline-md font-bold text-secondary-fixed tracking-tight">CYBERDECK-CONTROL</span>
        </div>
        <div className="flex items-center gap-unit">
          <div className="relative w-64 hidden md:block">
            <span className="material-symbols-outlined absolute left-unit top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full bg-surface-variant/30 border border-outline-variant rounded-DEFAULT text-on-surface pl-10 pr-unit py-1 focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed font-body-md text-body-md transition-colors h-8" 
              placeholder="Search macros..." 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'macros') {
                  setActiveTab('macros'); // Automatically route to macros tab when typing in search!
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-gutter relative">
          <button 
            type="button" 
            onClick={() => setActiveTab('security')}
            className={`text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors duration-200 p-unit rounded-DEFAULT scale-95 active:scale-90 transition-transform duration-150 hidden md:flex items-center justify-center ${activeTab === 'security' ? 'text-secondary-fixed' : ''}`}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button 
            type="button" 
            onClick={() => setShowHelpModal(true)}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors duration-200 p-unit rounded-DEFAULT scale-95 active:scale-90 transition-transform duration-150 hidden md:flex items-center justify-center"
          >
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-gutter py-2 rounded-DEFAULT hover:opacity-90 transition-opacity scale-95 active:scale-90 transition-transform duration-150 font-bold uppercase disabled:opacity-50"
          >
            {saving ? 'Applying...' : 'Apply Changes'}
          </button>
          
          {/* Avatar Profile Dropper */}
          <button 
            type="button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center overflow-hidden shrink-0 cursor-pointer scale-95 active:scale-90 transition-transform"
          >
            <div className="w-full h-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold text-xs uppercase">
              CD
            </div>
          </button>

          {/* Profile Menu Dropdown Overlay */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-12 bg-surface-container border border-outline-variant rounded shadow-xl w-64 py-2 z-50 font-body-md animate-fade-in text-left">
              <div className="px-4 py-2 border-b border-outline-variant">
                <p className="font-bold text-on-surface">Developer Profile</p>
                <p className="text-xs text-secondary-fixed">@mgarcia333</p>
              </div>
              <div className="px-4 py-3 space-y-1 border-b border-outline-variant text-xs text-on-surface-variant">
                <p className="flex justify-between"><span>Core State:</span> <strong className="text-emerald-400">ONLINE</strong></p>
                <p className="flex justify-between"><span>API Node:</span> <strong>gemini-pro</strong></p>
                <p className="flex justify-between"><span>Macros Node:</span> <strong>{status.activeMacrosCount} active</strong></p>
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleRestartCores();
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs hover:bg-surface-variant hover:text-secondary-fixed transition-colors flex items-center gap-2 uppercase font-bold"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Restart Core Engines
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SideNavBar */}
        <aside className="bg-surface-container-low/80 backdrop-blur-md border-r border-outline-variant fixed md:static left-0 top-0 bottom-0 flex flex-col justify-between py-unit w-64 z-30 transform -translate-x-full md:translate-x-0 transition-transform duration-300 h-full shrink-0">
          <div className="flex flex-col gap-margin-desktop">
            <div className="px-gutter flex items-center gap-unit mt-3">
              <div className="w-10 h-10 rounded-DEFAULT bg-surface-variant border border-outline-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary-fixed">hub</span>
              </div>
              <div>
                <h2 className="font-label-md text-label-md text-on-surface font-bold uppercase">Cyberdeck Engine</h2>
                <span className="font-data-num text-[10px] text-on-surface-variant">v2.4.0-stable</span>
              </div>
            </div>
            
            {/* Sidebar Active Navigation Mappings */}
            <nav className="flex flex-col gap-1">
              <button 
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 w-full text-left ${activeTab === 'dashboard' ? 'bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                <span className="font-body-md text-body-md">Dashboard</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('cognitive')}
                className={`font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 w-full text-left ${activeTab === 'cognitive' ? 'bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">psychology</span>
                <span className="font-body-md text-body-md">Cognitive</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('macros')}
                className={`font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 w-full text-left ${activeTab === 'macros' ? 'bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">settings_input_component</span>
                <span className="font-body-md text-body-md">Macros</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 w-full text-left ${activeTab === 'audio' ? 'bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">settings_voice</span>
                <span className="font-body-md text-body-md">Audio</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('security')}
                className={`font-bold flex items-center gap-unit px-gutter py-2 group hover:bg-surface-variant/30 transition-all duration-200 w-full text-left ${activeTab === 'security' ? 'bg-secondary-container/20 text-secondary-fixed border-r-2 border-secondary-fixed' : 'text-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-secondary-fixed opacity-70 group-hover:opacity-100">security</span>
                <span className="font-body-md text-body-md">Security</span>
              </button>
            </nav>
          </div>
          <nav className="flex flex-col gap-1 mb-3">
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group" href="https://github.com/mgarcia333/cyberdeck" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">description</span>
              <span className="font-label-md text-label-md uppercase">Docs</span>
            </a>
            <button type="button" onClick={handleRestartCores} className="text-on-surface-variant hover:text-secondary-fixed hover:bg-surface-variant/30 transition-all duration-200 flex items-center gap-unit px-gutter py-2 group w-full text-left">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">restart_alt</span>
              <span className="font-label-md text-label-md uppercase">Reboot Core</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-gutter md:p-margin-desktop flex justify-center">
          <div className="max-w-container-max w-full flex flex-col gap-margin-desktop">
            
            {/* ======================================= */}
            {/* 📊 TAB 1: DASHBOARD HOME (TELEMETRY & LOGS) */}
            {/* ======================================= */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-gutter animate-fade-in">
                <header className="mb-gutter">
                  <h1 className="font-headline-lg text-headline-lg hidden md:block text-primary">Cyberdeck System Telemetries</h1>
                  <h1 className="font-headline-md text-headline-md md:hidden text-primary">Cyberdeck Telemetries</h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">Real-time status diagnostics of background voice processing and cognitive nodes.</p>
                </header>

                {/* Status Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                  <div className="bg-surface-container border border-outline-variant p-gutter rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400"></div>
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Cores Link Status</span>
                    <h2 className="font-headline-md text-headline-md text-emerald-400 mt-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                      {status.status}
                    </h2>
                  </div>
                  <div className="bg-surface-container border border-outline-variant p-gutter rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary-fixed"></div>
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Background CPU Load</span>
                    <h2 className="font-headline-md text-headline-md text-primary mt-2">{status.cpuUsage}</h2>
                  </div>
                  <div className="bg-surface-container border border-outline-variant p-gutter rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary-fixed"></div>
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">Active Memory RAM</span>
                    <h2 className="font-headline-md text-headline-md text-primary mt-2">{status.memoryUsage}</h2>
                  </div>
                  <div className="bg-surface-container border border-outline-variant p-gutter rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-secondary-fixed"></div>
                    <span className="text-xs text-on-surface-variant uppercase font-semibold">System Core Uptime</span>
                    <h2 className="font-headline-md text-headline-md text-primary mt-2">{formatUptime(status.uptime)}</h2>
                  </div>
                </div>

                {/* CRT Terminal Log Feed */}
                <div className="bg-black border border-outline-variant rounded-lg p-gutter mt-gutter flex flex-col h-96 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                  
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 mb-3">
                    <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                      CYBERDECK MONITOR LOGS
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-data-num">ONLINE DIAGNOSTIC NODES</span>
                  </div>

                  <div className="flex-1 overflow-y-auto font-data-num text-xs space-y-2 select-text">
                    {systemLogs.map((log) => (
                      <div key={log.id} className="flex gap-4">
                        <span className="text-on-surface-variant">[{log.time}]</span>
                        <span className={`font-bold ${
                          log.type === 'SYS' ? 'text-primary' :
                          log.type === 'CMD' ? 'text-secondary-fixed' :
                          log.type === 'LLM' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>[{log.type}]</span>
                        <span className="text-on-surface">{log.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant/30 pt-2 mt-3 flex justify-between text-[10px] text-on-surface-variant font-label-md">
                    <span>ACTIVE CORE WAKE WORD: "{status.wakeWord.toUpperCase()}"</span>
                    <span>{status.activeMacrosCount} LOADED ACTION MACROS</span>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* 🧠 TAB 2: COGNITIVE SETTINGS (LLM) */}
            {/* ======================================= */}
            {activeTab === 'cognitive' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter animate-fade-in">
                <div className="lg:col-span-12">
                  <header className="mb-gutter">
                    <h1 className="font-headline-lg text-headline-lg text-primary">Cognitive AI Core Configuration</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">Adjust backend cloud artificial intelligence models and instruction pipelines.</p>
                  </header>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-gutter">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                    <div className="flex items-center gap-unit mb-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">memory</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Cognitive Core</h3>
                    </div>

                    <div className="flex flex-col gap-unit mt-gutter">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">AI Engine Provider</label>
                        <select 
                          className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                          {...register('llmProvider')}
                        >
                          <option className="bg-surface-container" value="gemini">Google Gemini Pro</option>
                          <option className="bg-surface-container" value="groq">Groq Llama-3</option>
                        </select>
                      </div>
                      
                      <div className="mt-4 relative">
                        <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">API Key</label>
                        <input 
                          className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 pr-8 focus:outline-none font-data-num text-data-num transition-colors placeholder-on-surface-variant/50" 
                          type={showApiKey ? "text" : "password"} 
                          placeholder={selectedProvider === 'gemini' ? "Enter Google Gemini API Key..." : "Enter Groq Cloud API Key..."}
                          {...register('apiKey')}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-1 top-[28px] text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {showApiKey ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                    <div className="flex items-center gap-unit mb-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">tune</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Model Hyperparameters</h3>
                    </div>

                    <div className="flex flex-col gap-gutter mt-gutter">
                      <div>
                        <div className="flex justify-between font-label-md text-label-md text-on-surface-variant uppercase mb-1">
                          <span>Temperature</span>
                          <span className="text-secondary-fixed">{watch('temperature')}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.0" 
                          max="1.0" 
                          step="0.05"
                          className="w-full accent-secondary-fixed bg-surface-variant h-1 rounded"
                          {...register('temperature', { valueAsNumber: true })}
                        />
                        <span className="text-[10px] text-on-surface-variant mt-1 block">Low values enforce deterministic, technical replies. High values allow creative answers.</span>
                      </div>

                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">Max Tokens Allocation</label>
                        <input 
                          type="number" 
                          className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md"
                          {...register('maxTokens', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-7 flex flex-col">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter flex flex-col h-full">
                    <div className="flex items-center gap-unit mb-3">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">terminal</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Cyberdeck Core Personality Instruction</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-gutter">Customized instructions and behavior system prompt templates natively injected into the cloud models before every conversation interaction.</p>
                    
                    <textarea 
                      className="w-full flex-1 bg-surface/50 border border-outline-variant focus:border-secondary-fixed rounded text-on-surface p-3 focus:outline-none font-data-num text-xs resize-none min-h-[300px]"
                      placeholder="Define how the AI behaves..."
                      {...register('systemInstruction')}
                    />
                  </section>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* ⚙️ TAB 3: CUSTOM MACRO TRIGGERS */}
            {/* ======================================= */}
            {activeTab === 'macros' && (
              <div className="flex flex-col gap-gutter animate-fade-in">
                <header className="mb-gutter flex justify-between items-end">
                  <div>
                    <h1 className="font-headline-lg text-headline-lg text-primary">Custom Command Macro Triggers</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 font-light">Link offline spoken word phrases directly to shell actions, web pages, or native keystrokes.</p>
                  </div>
                  
                  {/* Dynamic Macro Trigger search */}
                  <div className="relative w-64 md:hidden">
                    <span className="material-symbols-outlined absolute left-unit top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                    <input 
                      className="w-full bg-surface-variant/30 border border-outline-variant rounded text-on-surface pl-10 pr-unit py-1 focus:outline-none focus:border-secondary-fixed" 
                      placeholder="Search..." 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </header>

                <section className="bg-surface-container border border-outline-variant rounded-lg flex flex-col h-full overflow-hidden">
                  <div className="p-gutter border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                    <div className="flex items-center gap-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">code_blocks</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Active Cyberdeck Command Map</h3>
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddMacro}
                      className="border border-outline-variant text-on-surface hover:text-secondary-fixed hover:border-secondary-fixed font-label-md text-label-md px-3 py-1 rounded-DEFAULT transition-colors flex items-center gap-1 uppercase"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add Macro Trigger
                    </button>
                  </div>
                  
                  <div className="p-gutter overflow-x-auto flex-1 max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant">
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold w-1/3">Spoken Trigger Phrase</th>
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold w-1/4">Execution Node Type</th>
                          <th className="font-label-md text-label-md text-on-surface-variant uppercase pb-2 px-2 font-semibold">Action Payload</th>
                          <th className="pb-2 px-2 w-20 text-right">Row Action</th>
                        </tr>
                      </thead>
                      <tbody className="font-data-num text-data-num text-on-surface divide-y divide-outline-variant/50">
                        {filteredFields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-on-surface-variant font-body-md">
                              {searchQuery ? 'No custom macro triggers matched your search query.' : 'No triggers matched or defined yet. Click Add Macro Trigger!'}
                            </td>
                          </tr>
                        ) : (
                          filteredFields.map(({ field, index }) => {
                            const watchedType = watch(`customCommands.${index}.actionType`);
                            const watchedPayload = watch(`customCommands.${index}.payload`);
                            
                            return (
                              <tr key={field.id} className="hover:bg-surface-variant/20 transition-colors group">
                                <td className="py-3 px-2">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-on-surface py-1 focus:outline-none"
                                    placeholder="Trigger e.g. open registry editor"
                                    {...register(`customCommands.${index}.trigger`)}
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <select 
                                    className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-on-surface py-1 focus:outline-none cursor-pointer"
                                    {...register(`customCommands.${index}.actionType`)}
                                  >
                                    <option className="bg-surface-container" value="open_url">Open URL</option>
                                    <option className="bg-surface-container" value="cli_command">CLI Command</option>
                                    <option className="bg-surface-container" value="keystroke">Keystroke</option>
                                  </select>
                                </td>
                                <td className="py-3 px-2">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent border-b border-transparent focus:border-secondary-fixed text-secondary-fixed/90 py-1 focus:outline-none"
                                    placeholder={
                                      watchedType === 'open_url' ? "e.g. google.com" :
                                      watchedType === 'cli_command' ? "e.g. dir C:\\" : "e.g. ctrl+alt+delete"
                                    }
                                    {...register(`customCommands.${index}.payload`)}
                                  />
                                </td>
                                <td className="py-3 px-2 text-right flex gap-3 justify-end items-center">
                                  {/* Dynamic test action simulation ▶ */}
                                  <button
                                    type="button"
                                    onClick={() => handleTestMacro(watchedType, watchedPayload)}
                                    title="Execute / simulate command now"
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => remove(index)}
                                    className="text-on-surface-variant hover:text-error transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-unit border-t border-outline-variant bg-surface-container-lowest flex justify-end">
                    <span className="font-data-num text-[10px] text-on-surface-variant px-3 py-1">
                      {fields.length} Spoken Macro Commands Active
                    </span>
                  </div>
                </section>
              </div>
            )}

            {/* ======================================= */}
            {/* 🔊 TAB 4: AUDIO AND VOICE SYSTEM */}
            {/* ======================================= */}
            {activeTab === 'audio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter animate-fade-in">
                <div className="lg:col-span-12">
                  <header className="mb-gutter">
                    <h1 className="font-headline-lg text-headline-lg text-primary">Vocal Activation & Audio Controls</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 font-light">Configure wake phrases and adjust Windows native SAPI Offline Text-To-Speech parameters.</p>
                  </header>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-gutter">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                    <div className="flex items-center gap-unit mb-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">settings_voice</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Vocal Diagnostics</h3>
                    </div>

                    <div className="flex flex-col gap-unit mt-gutter">
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">Voice Wake Word</label>
                        <input 
                          className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors placeholder-on-surface-variant/50" 
                          placeholder="e.g. cyberdeck" 
                          type="text" 
                          {...register('wakeWord')}
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block font-label-md text-label-md text-on-surface-variant uppercase mb-1">System TTS Voice</label>
                        <select 
                          className="w-full bg-surface/50 border-b border-outline-variant focus:border-secondary-fixed text-on-surface py-2 px-1 focus:outline-none font-body-md text-body-md transition-colors appearance-none cursor-pointer"
                          {...register('ttsVoice')}
                        >
                          <option className="bg-surface-container" value="Default">System Default Voice</option>
                          {availableVoices.map((voice) => (
                            <option key={voice} className="bg-surface-container" value={voice}>
                              {voice}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-7 flex flex-col">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter flex flex-col h-full">
                    <div className="flex items-center gap-unit mb-gutter">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">volume_up</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Speech Synthesizer Adjustments</h3>
                    </div>

                    <div className="space-y-6 flex-1">
                      {/* TTS Speed Rate Slider */}
                      <div>
                        <div className="flex justify-between font-label-md text-label-md text-on-surface-variant uppercase mb-1">
                          <span>Speech Rate Speed</span>
                          <span className="text-secondary-fixed">x{watch('ttsSpeed')}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.0" 
                          step="0.1"
                          className="w-full accent-secondary-fixed bg-surface-variant h-1 rounded"
                          {...register('ttsSpeed', { valueAsNumber: true })}
                        />
                      </div>

                      {/* TTS Volume Slider */}
                      <div>
                        <div className="flex justify-between font-label-md text-label-md text-on-surface-variant uppercase mb-1">
                          <span>Voice Output Volume</span>
                          <span className="text-secondary-fixed">{watch('ttsVolume')}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5"
                          className="w-full accent-secondary-fixed bg-surface-variant h-1 rounded"
                          {...register('ttsVolume', { valueAsNumber: true })}
                        />
                      </div>

                      {/* TTS Pitch Slider */}
                      <div>
                        <div className="flex justify-between font-label-md text-label-md text-on-surface-variant uppercase mb-1">
                          <span>Synthesizer Pitch Tone</span>
                          <span className="text-secondary-fixed">{watch('ttsPitch')}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.1"
                          className="w-full accent-secondary-fixed bg-surface-variant h-1 rounded"
                          {...register('ttsPitch', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* 🛡️ TAB 5: SECURITY AND ADVANCED CONFIG */}
            {/* ======================================= */}
            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter animate-fade-in">
                <div className="lg:col-span-12">
                  <header className="mb-gutter">
                    <h1 className="font-headline-lg text-headline-lg text-primary">Security & Advanced Sandbox</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 font-light">Secure execution nodes and restore system configurations to factory settings.</p>
                  </header>
                </div>

                <div className="lg:col-span-6 flex flex-col gap-gutter">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-secondary-fixed transition-colors"></div>
                    <div className="flex items-center gap-unit mb-unit">
                      <span className="material-symbols-outlined text-secondary-fixed text-lg">admin_panel_settings</span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">Execution Sandboxing</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 mb-gutter">When safe execution mode is enabled, Cyberdeck will prompt you with a diagnostic speech warning before executing custom CLI script commands in Windows Command Prompt.</p>

                    <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-outline-variant/30">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface font-semibold uppercase block">Safe Execution Mode</span>
                        <span className="text-[10px] text-on-surface-variant">Verify CLI actions natively before running</span>
                      </div>
                      
                      {/* Checkbox toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          {...register('safeMode')}
                        />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-fixed"></div>
                      </label>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-6 flex flex-col gap-gutter">
                  <section className="bg-surface-container border border-outline-variant rounded-lg p-gutter relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-error transition-colors"></div>
                    <div className="flex items-center gap-unit mb-unit">
                      <span className="material-symbols-outlined text-error text-lg">warning</span>
                      <h3 className="font-headline-md text-headline-md text-error">System Factory Wipe</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 mb-gutter">This operation will permanently wipe your active local configuration database file <code className="text-error">config.json</code>, removing all spoken macro command trigger fields and resetting API Keys.</p>

                    <button 
                      type="button"
                      onClick={handleFactoryReset}
                      className="w-full bg-error/10 hover:bg-error/25 border border-error/50 text-error font-label-md text-label-md py-3 rounded uppercase font-bold transition-all scale-95 active:scale-90 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Factory Reset Config
                    </button>
                  </section>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </form>
  );
}
