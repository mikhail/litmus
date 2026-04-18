export interface Criterion {
  id: string;
  label: string;
  description?: string;
}

export interface TestPacket {
  id: string;
  name: string;
  description?: string;
  criteria: Criterion[];
  createdAt: number;
}

export interface TestResult {
  criterionId: string;
  pass: boolean;
  reasoning: string;
}

export interface RunResult {
  packetId: string;
  results: TestResult[];
  timestamp: number;
}

export interface DemoContext {
  id: string;
  name: string;
  icon: string;
  packets: TestPacket[];
  sampleText: string;
}
