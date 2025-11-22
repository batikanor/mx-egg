namespace Loupedeck.VolHapticPlugin
{
    using System;

    // This class implements an example adjustment that counts the rotation ticks of a dial.

    public class CounterAdjustment : PluginDynamicAdjustment
    {
        // This variable holds the current value of the counter.
        private Int32 _counter = 0;

        // Initializes the adjustment class.
        // When `hasReset` is set to true, a reset command is automatically created for this adjustment.
        public CounterAdjustment()
            : base(displayName: "Tick Counter", description: "Counts rotation ticks", groupName: "Adjustments", hasReset: true)
        {
        }

        // This method is called when the adjustment is executed.
        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            this._counter += diff; // Increase or decrease the counter by the number of ticks.
            this.AdjustmentValueChanged(); // Notify the plugin service that the adjustment value has changed.
        }

        protected override Boolean OnLoad()
        {
            this.Plugin.PluginEvents.AddEvent(
                "buttonPress",           // Event name (must match YAML files)
                "Play Haptic",           // Display name
                "Plays a haptic"         // Description
            );

            return true;
        }

        // This method is called when the reset command related to the adjustment is executed.
        protected override void RunCommand(String actionParameter)
        {
            this.Plugin.PluginEvents.RaiseEvent(
                "buttonPress"            // Event name (must match YAML files)
            );
        }

        // Returns the adjustment value that is shown next to the dial.
        protected override String GetAdjustmentValue(String actionParameter) => this._counter.ToString();
    }
}
