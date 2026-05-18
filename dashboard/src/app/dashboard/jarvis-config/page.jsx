"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SettingsIcon from '@mui/icons-material/Settings';
import VoiceIcon from '@mui/icons-material/SettingsVoice';
import CodeIcon from '@mui/icons-material/Code';
import HelpIcon from '@mui/icons-material/Help';

// Premium Neon-Retro Dark Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff66', // Matrix/Retro CRT Neon Green
    },
    secondary: {
      main: '#00f0ff', // Cyberpunk Cyan
    },
    background: {
      default: '#0a0c10',
      paper: '#121620',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '0.05em',
      textShadow: '0 0 10px rgba(0, 255, 102, 0.3)',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default function JarvisConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableVoices, setAvailableVoices] = useState([]);

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      assistantName: 'Jarvis',
      wakeWord: 'jarvis',
      ttsVoice: 'Microsoft Zira',
      llmProvider: 'gemini',
      apiKey: '',
      customCommands: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customCommands'
  });

  // Fetch available speech synthesis voices in the browser as voice options
  useEffect(() => {
    const fetchVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Clean/deduplicate and filter Spanish/English common voices or show all
          setAvailableVoices(voices.map(v => v.name));
        }
      }
    };
    
    fetchVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  // Fetch config.json on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to fetch config');
        const data = await res.json();
        
        // Setup initial default customCommands if empty
        if (!data.customCommands) {
          data.customCommands = [];
        }
        reset(data);
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
        message: 'Configuration saved and hot-reloaded successfully!',
        severity: 'success'
      });
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

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0a0c10">
          <CircularProgress color="primary" size={60} thickness={4} />
          <Typography variant="h6" color="primary" sx={{ mt: 3, letterSpacing: '0.1em' }}>
            SYNCHRONIZING CONFIGURATION...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', py: 6, px: 2, background: 'linear-gradient(135deg, #07090e 0%, #0d121c 100%)' }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={6}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(0, 255, 102, 0.1)',
                border: '2px solid #00ff66',
                boxShadow: '0 0 15px rgba(0, 255, 102, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SettingsIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h4" color="primary">
                JARVIS CONTROL PANEL
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              sx={{
                px: 4,
                py: 1.2,
                fontSize: '1rem',
                boxShadow: '0 0 20px rgba(0, 255, 102, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 30px rgba(0, 255, 102, 0.6)',
                }
              }}
            >
              {saving ? 'Saving...' : 'Apply Changes'}
            </Button>
          </Box>

          <Grid container spacing={4}>
            {/* General Settings */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <VoiceIcon color="secondary" />
                    <Typography variant="h6" color="secondary">
                      General Assistant Parameters
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Assistant Name"
                        placeholder="e.g. Jarvis"
                        variant="outlined"
                        {...register('assistantName', { required: true })}
                        helperText="The name Jarvis uses to refer to himself"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Voice Wake Word"
                        placeholder="e.g. jarvis"
                        variant="outlined"
                        {...register('wakeWord', { required: true })}
                        helperText="Voice keyword to trigger processing (case-insensitive)"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel id="tts-voice-label">Text-To-Speech System Voice</InputLabel>
                        <Controller
                          name="ttsVoice"
                          control={control}
                          render={({ field }) => (
                            <Select
                              labelId="tts-voice-label"
                              label="Text-To-Speech System Voice"
                              {...field}
                            >
                              <MenuItem value="Default">System Default Voice</MenuItem>
                              {availableVoices.map((voiceName) => (
                                <MenuItem key={voiceName} value={voiceName}>
                                  {voiceName}
                                </MenuItem>
                              ))}
                              {/* Standard fallback voices if browser speechSynthesis has none loaded yet */}
                              {availableVoices.length === 0 && (
                                <>
                                  <MenuItem value="Microsoft David">Microsoft David (US English)</MenuItem>
                                  <MenuItem value="Microsoft Zira">Microsoft Zira (US English female)</MenuItem>
                                  <MenuItem value="Microsoft Hazel">Microsoft Hazel (UK English)</MenuItem>
                                  <MenuItem value="Google US English">Google US English</MenuItem>
                                </>
                              )}
                            </Select>
                          )}
                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <CodeIcon color="primary" />
                        <Typography variant="subtitle1" color="primary" fontWeight="bold">
                          Cognitive Engine (LLM)
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel id="llm-provider-label">AI Engine Provider</InputLabel>
                        <Controller
                          name="llmProvider"
                          control={control}
                          render={({ field }) => (
                            <Select
                              labelId="llm-provider-label"
                              label="AI Engine Provider"
                              {...field}
                            >
                              <MenuItem value="gemini">Gemini API (gemini-1.5-flash)</MenuItem>
                              <MenuItem value="groq">Groq API (llama3-8b-8192)</MenuItem>
                            </Select>
                          )}
                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Key"
                        type={showApiKey ? 'text' : 'password'}
                        variant="outlined"
                        placeholder={watch('llmProvider') === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                        {...register('apiKey')}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle api key visibility"
                                onClick={() => setShowApiKey(!showApiKey)}
                                edge="end"
                              >
                                {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        helperText="Provide your credentials. Key is kept locally."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Custom Macros Builder */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <CodeIcon color="secondary" />
                      <Typography variant="h6" color="secondary">
                        Custom Action Macros Builder
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => append({ trigger: '', actionType: 'open_url', payload: '' })}
                      sx={{ borderWeight: 2 }}
                    >
                      Add Macro
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                  {fields.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} sx={{ minHeight: 250, opacity: 0.5 }}>
                      <CodeIcon sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="body1">No custom macros defined.</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Click "Add Macro" to create standard voice macros.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, bgcolor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Trigger Phrase</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', width: 150 }}>Action Type</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Execution Payload</TableCell>
                            <TableCell sx={{ width: 50 }}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fields.map((item, index) => (
                            <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' } }}>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="e.g. open youtube"
                                  variant="standard"
                                  {...register(`customCommands.${index}.trigger`, { required: true })}
                                  InputProps={{ disableUnderline: true }}
                                  sx={{ input: { color: '#e2e8f0' } }}
                                />
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <Controller
                                  name={`customCommands.${index}.actionType`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      fullWidth
                                      size="small"
                                      variant="standard"
                                      disableUnderline
                                      {...field}
                                    >
                                      <MenuItem value="open_url">Open URL</MenuItem>
                                      <MenuItem value="cli_command">CLI Command</MenuItem>
                                      <MenuItem value="keystroke">Keystroke</MenuItem>
                                    </Select>
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder={
                                    watch(`customCommands.${index}.actionType`) === 'open_url'
                                      ? 'https://google.com'
                                      : watch(`customCommands.${index}.actionType`) === 'cli_command'
                                      ? 'start chrome'
                                      : 'Ctrl+Shift+I'
                                  }
                                  variant="standard"
                                  {...register(`customCommands.${index}.payload`, { required: true })}
                                  InputProps={{ disableUnderline: true }}
                                  sx={{ input: { color: '#00f0ff', fontFamily: 'monospace' } }}
                                />
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(index)}
                                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
                    <HelpIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      Jarvis intercepts voice input that matches a Trigger Phrase exactly, bypassing the LLM to execute macros immediately.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* Global Alert Notification */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
