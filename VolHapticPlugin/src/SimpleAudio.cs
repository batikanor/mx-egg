using System;
using System.Runtime.InteropServices;

namespace VolHapticPlugin
{
    // 1. Define COM Interfaces
    [ComImport]
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDeviceEnumerator
    {
        int EnumAudioEndpoints(int dataFlow, int stateMask, out object ppDevices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
        int GetDevice(string pwstrId, out IMMDevice ppDevice);
        int RegisterEndpointNotificationCallback(object pClient);
        int UnregisterEndpointNotificationCallback(object pClient);
    }

    [ComImport]
    [Guid("D666063F-1587-4E43-81F1-B948E807363F")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDevice
    {
        int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }

    [ComImport]
    [Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioMeterInformation
    {
        int GetPeakValue(out float pfPeak);
    }

    // 2. Dynamic Wrapper Class (Fixes the Bluetooth/Speaker switching issue)
    [System.Runtime.Versioning.SupportedOSPlatform("windows")] 
    public class SimpleAudioMeter
    {
        private IMMDeviceEnumerator _enumerator;

        public SimpleAudioMeter()
        {
            // We only create the Enumerator tool once.
            var type = Type.GetTypeFromCLSID(new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E"));
            object enumObj = Activator.CreateInstance(type);
            _enumerator = (IMMDeviceEnumerator)enumObj;
        }

        public float GetPeak()
        {
            IMMDevice device = null;
            IAudioMeterInformation meter = null;
            float peak = 0f;

            try
            {
                // --- KEY FIX IS HERE ---
                // We ask Windows "What is the default speaker RIGHT NOW?" every single time.
                _enumerator.GetDefaultAudioEndpoint(0, 1, out device);

                // Activate the meter for that specific device
                var iidAudioMeter = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
                object meterObj;
                device.Activate(ref iidAudioMeter, 1, IntPtr.Zero, out meterObj);
                
                meter = (IAudioMeterInformation)meterObj;

                // Read the volume
                meter.GetPeakValue(out peak);
            }
            catch
            {
                // If the device is switching (e.g. you just unplugged headphones), 
                // this might fail for 1 frame. Return 0 to be safe.
                return 0f;
            }
            finally
            {
                // CRITICAL: We must clean up memory because we do this 100 times a second.
                if (meter != null) Marshal.ReleaseComObject(meter);
                if (device != null) Marshal.ReleaseComObject(device);
            }

            return peak;
        }
    }
}