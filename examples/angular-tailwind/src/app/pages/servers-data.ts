import { Condition } from '@metapatrol/ng';

export interface Server {
  name: string;
  image: string;
  revision: string;
  tools: number;
  updated: string;
  conditions: Condition[];
  instructions: string;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** A few MCP servers, as an mcp-gateway might list them. */
export const SERVERS: Server[] = [
  {
    name: 'grep',
    image: 'registry.example/mcp/grep:1.4.0',
    revision: 'sha256:3f2a9c1e0b7d55aa66bb77cc88dd99ee00ff1122',
    tools: 3,
    updated: minutesAgo(2),
    conditions: [
      { type: 'Valid', status: 'True', reason: 'Validated', message: 'the spec is valid', lastTransitionTime: minutesAgo(90) },
      { type: 'Ready', status: 'True', reason: 'Serving', message: '3 tools on 2 replicas', lastTransitionTime: minutesAgo(2) },
    ],
    instructions: '# grep\n\nSearches **files** in the workspace.\n\n- `pattern`: a regular expression\n- `path`: where to look, `.` by default\n\nSee [the docs](https://example.org/grep).',
  },
  {
    name: 'memory-engram',
    image: 'registry.example/ai/engram:1.1.0',
    revision: 'sha256:91c0ffee5e5e7a7a1b1b2c2c3d3d4e4e5f5f6a6a',
    tools: 7,
    updated: minutesAgo(45),
    conditions: [
      { type: 'Valid', status: 'True', reason: 'Validated', message: 'the spec is valid', lastTransitionTime: minutesAgo(600) },
      { type: 'Ready', status: 'False', reason: 'ServerUnavailable', message: 'the backend engram does not answer', lastTransitionTime: minutesAgo(45) },
    ],
    instructions: 'Recall and store **memories**. Prefer `recall` before `learn`.',
  },
  {
    name: 'kubectl',
    image: 'registry.example/tools/kubectl:1.34.1',
    revision: 'sha256:0badc0de11112222333344445555666677778888',
    tools: 12,
    updated: minutesAgo(3000),
    conditions: [
      { type: 'Valid', status: 'False', reason: 'InvalidImage', message: 'the image is not in the allowed registries', lastTransitionTime: minutesAgo(3000) },
      { type: 'Ready', status: 'Unknown', reason: 'NotReconciled', lastTransitionTime: minutesAgo(3000) },
    ],
    instructions: 'Runs `kubectl` against the session cluster.',
  },
];

export const manifest = (s: Server) => `apiVersion: mcp.metapatrol.io/v1
kind: Server
metadata:
  name: ${s.name}
spec:
  image: ${s.image}
  replicas: 2
  # pinned by the controller
  revision: ${s.revision}
status:
  tools: ${s.tools}
  conditions:
${s.conditions.map((c) => `    - type: ${c.type}\n      status: "${c.status}"\n      reason: ${c.reason ?? ''}`).join('\n')}
`;
