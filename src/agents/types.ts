export type AgentStatus = "ativo" | "inativo";

export type AgentConfig = {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
};

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
};

export type CodeEdit = {
  filePath: string;
  content: string;
  originalContent?: string;
};
