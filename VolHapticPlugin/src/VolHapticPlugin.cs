using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Loupedeck;

namespace VolHapticPlugin
{
    // Add this Attribute to inform the compiler that this runs only on Windows, suppressing the warning.
    [System.Runtime.Versioning.SupportedOSPlatform("windows")]
    public class VolHapticPlugin : Plugin
    {
        private const string EVENT_NAME = "buttonPress"; 
        
        // --- Core Parameter Configuration ---
        // 1. Sensitivity: Lower value means higher sensitivity (0.02 ~ 0.10)
        private const float JUMP_SENSITIVITY = 0.05f; 
        
        // 2. Absolute Threshold: Detection only occurs above this volume level (0.05 ~ 0.20)
        private const float ABSOLUTE_THRESHOLD = 0.15f;

        // 3. Cooldown: Prevents excessive/spam vibration (ms)
        private const int COOLDOWN_MS = 20;

        // 4. [Sync Delay]: Fixes the "haptics trigger before audio" issue (ms)
        // Try 100-150 for Bluetooth headphones, 20-50 for wired.
        private const int SYNC_DELAY_MS = 120; 
        // -----------------------

        private CancellationTokenSource _cancellationTokenSource;
        private DateTime _lastTriggerTime = DateTime.MinValue;
        private string _debugLogPath;

        public override void Load()
        {
            this._debugLogPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "haptic_debug.txt");
            this.LogToFile("Plugin Loaded. Starting Task...");

            this.PluginEvents.AddEvent(EVENT_NAME, "Audio Beat Hit", "Triggers haptics when volume peaks.");

            this._cancellationTokenSource = new CancellationTokenSource();
            Task.Run(() => this.AudioMonitorLoop(this._cancellationTokenSource.Token));
        }

        public override void Unload()
        {
            this.LogToFile("Plugin Unloaded.");
            this._cancellationTokenSource?.Cancel();
            this._cancellationTokenSource?.Dispose();
        }

        private void AudioMonitorLoop(CancellationToken token)
        {
            this.LogToFile("Task Started. Initializing Native Audio...");
            
            // Fix: Variable must be declared outside the try block so it remains visible to the subsequent while loop.
            SimpleAudioMeter audioMeter = null;

            try
            {
                // Initialize our custom SimpleAudio class
                audioMeter = new SimpleAudioMeter();
                this.LogToFile("SUCCESS: Audio Initialized!");
            }
            catch (Exception ex)
            {
                this.LogToFile($"CRITICAL ERROR: {ex.Message}");
                // If initialization fails, exit the thread immediately to prevent infinite loop errors.
                return;
            }

            float previousPeak = 0f;

            while (!token.IsCancellationRequested)
            {
                try
                {
                    // Get current audio peak
                    float currentPeak = audioMeter.GetPeak();

                    // Algorithmic checks
                    bool isLoudEnough = currentPeak > ABSOLUTE_THRESHOLD;
                    bool isRisingFast = currentPeak > (previousPeak + JUMP_SENSITIVITY);
                    bool isCooledDown = (DateTime.Now - this._lastTriggerTime).TotalMilliseconds > COOLDOWN_MS;

                    if (isLoudEnough && isRisingFast && isCooledDown)
                    {
                        // >>> Sync Delay Logic <<<
                        if (SYNC_DELAY_MS > 0)
                        {
                            Thread.Sleep(SYNC_DELAY_MS);
                        }

                        // Trigger haptic feedback
                        this.PluginEvents.RaiseEvent(EVENT_NAME);
                        
                        // Update last trigger time
                        this._lastTriggerTime = DateTime.Now;
                    }

                    // Update previous peak volume
                    previousPeak = currentPeak;
                }
                catch
                {
                    // Ignore sporadic errors within the loop
                }

                // Maintain high refresh rate (10ms)
                Thread.Sleep(2);
            }
        }

        private void LogToFile(string message)
        {
            try 
            {
                File.AppendAllText(this._debugLogPath, $"{DateTime.Now:HH:mm:ss.fff}: {message}\n");
            }
            catch { }
        }
    }
}