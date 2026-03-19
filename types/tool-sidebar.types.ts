type Tool = "screenshot" | "elements" | "audio" | "zoom" | "mockup";

export interface ToolsSidebarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}