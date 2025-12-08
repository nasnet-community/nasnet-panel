// Main component
export { ShowConfig } from "./ShowConfig";

// Hooks
export { useConfigGenerator as useShow } from "./useShow";
export { useEasyModeDefaults } from "./useEasyModeDefaults";

// Components - export Header with alias to avoid conflicts
export { Code } from "./Code";
export { Header as ShowConfigHeader } from "./Header";
export { TutorialCard } from "./TutorialCard";
// MikrotikConfigExample is commented out/not implemented
// export { MikrotikConfigExample } from "./MikrotikConfigExample";
export { MikrotikApplyConfig } from "./MikrotikApplyConfig";
export { ScriptGuide } from "./ScriptGuide";
export { PythonGuide } from "./PythonGuide";
export { EasyModeDownloadCard } from "./EasyModeDownloadCard";

// Re-export from subdirectories
export * from "./DocumentSection";
