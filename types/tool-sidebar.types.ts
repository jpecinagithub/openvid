type Tool = "screenshot" | "elements" | "audio" | "zoom" | "mockup" | "cursor";

export interface ToolsSidebarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}