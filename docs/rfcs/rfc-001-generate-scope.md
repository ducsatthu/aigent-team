# RFC-001: Generate Scope & Plugin Mode

| Field | Value |
|-------|-------|
| **Status** | `completed` |
| **Created** | 2026-03-30 |
| **Target version** | v0.3.0 |
| **Branch** | main |
| **Completed** | Phase 1-4 (all phases) |

---

## Problem

Hiện tại `aigent-team generate` luôn tạo **toàn bộ** output (agent skill index + references + skills) cho mọi team role. Người dùng không có cách nào để:

1. Chỉ tạo **skills** cho các role (ví dụ: chỉ cần các executable procedures, không cần agent config)
2. Chỉ tạo **references** (deep docs) mà không cần agent config
3. Tạo một **plugin bundle** hoàn chỉnh với cấu trúc chuẩn, có thể share/publish

---

## Proposal: `--scope` Option

Thêm option `--scope` vào lệnh `generate` để kiểm soát **loại output** được tạo ra.

### Các scope hỗ trợ

| Scope | Output | Use case |
|-------|--------|----------|
| `all` (default) | Agent skill index + references + skills | Hành vi hiện tại, không thay đổi gì |
| `agents` | Chỉ agent skill index files (rules + skill content) | Chỉ cần agent config, không cần on-demand files |
| `skills` | Chỉ skill files (executable procedures) | Team muốn dùng skills như standalone playbooks |
| `references` | Chỉ reference files (deep docs) | Tạo documentation library |
| `plugin` | Bundle hoàn chỉnh với manifest | Share/publish dưới dạng package |

### CLI Interface

```bash
# Hành vi hiện tại (không thay đổi)
aigent-team generate

# Chỉ tạo skills cho tất cả roles
aigent-team generate --scope skills

# Chỉ tạo skills cho FE và BE
aigent-team generate --scope skills --team fe,be

# Chỉ tạo agent configs (không có references/skills)
aigent-team generate --scope agents

# Kết hợp nhiều scope
aigent-team generate --scope agents,skills

# Tạo plugin bundle (bao gồm tất cả + manifest)
aigent-team generate --scope plugin
```

### Option `--team` filter (bonus)

Hiện tại `config.teams` quyết định team nào được generate. Thêm `--team` CLI flag để override tạm thời:

```bash
# Config có 6 teams, nhưng chỉ generate cho fe
aigent-team generate --team fe

# Kết hợp: chỉ skills của fe và be
aigent-team generate --scope skills --team fe,be
```

---

## Proposal: Plugin Mode (`--scope plugin`)

Plugin mode tạo ra một **self-contained bundle** có thể share hoặc publish.

### Plugin Output Structure

Output directory mặc định: `.aigent-team-plugin/`, có thể config qua `output.pluginDir` trong config file.

```
<pluginDir>/   (default: .aigent-team-plugin/)
├── manifest.json            # Metadata: version, roles, platforms, checksums
├── agents/
│   ├── lead-agent.md
│   ├── fe-agent.md
│   └── ...
├── skills/
│   ├── lead/
│   │   ├── task-decomposition.md
│   │   └── ...
│   ├── fe/
│   │   ├── component-tdd.md
│   │   └── ...
│   └── ...
├── references/
│   ├── lead/
│   │   └── ...
│   ├── fe/
│   │   └── ...
│   └── ...
└── shared/
    └── ...
```

### manifest.json

```json
{
  "name": "aigent-team-plugin",
  "version": "0.2.0",
  "generatedAt": "2026-03-30T10:00:00Z",
  "generator": "aigent-team@0.2.0",
  "projectName": "my-app",
  "roles": ["lead", "fe", "be", "qa"],
  "platforms": ["claude-code", "cursor"],
  "files": {
    "agents": 4,
    "skills": 24,
    "references": 16
  }
}
```

### Use Cases cho Plugin

1. **Team sharing** — Lead tạo plugin, share cho team members install
2. **Version control** — Commit plugin bundle, track changes qua git
3. **Custom distribution** — Publish lên npm hoặc internal registry
4. **Backup/restore** — Snapshot toàn bộ agent config tại một thời điểm

---

## Technical Design

### 1. Thay đổi Types (`src/core/types.ts`)

```typescript
// Thêm GenerateScope enum
export const GENERATE_SCOPES = ['all', 'agents', 'skills', 'references', 'plugin'] as const;
export type GenerateScope = (typeof GENERATE_SCOPES)[number];

// Mở rộng GenerateOptions
interface GenerateOptions {
  platform?: Platform;
  scope?: GenerateScope[];  // NEW — mảng, cho phép multi-scope (e.g. ['agents', 'skills'])
  teams?: TeamRole[];       // NEW — CLI override cho config.teams
}
```

**Quy tắc scope combinations:**
- `plugin` là exclusive — nếu có `plugin` trong mảng, bỏ qua các scope khác (plugin = all + manifest)
- `all` là exclusive — tương đương `['agents', 'skills', 'references']`
- Các scope khác có thể kết hợp tự do: `['agents', 'skills']`, `['skills', 'references']`, v.v.

### 2. Thay đổi BaseCompiler (`src/compilers/base.compiler.ts`)

Tách `compile()` thành các phần nhỏ hơn để scope có thể chọn lọc:

```typescript
abstract class BaseCompiler {
  // Existing
  abstract compile(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[];

  // NEW — Compile với scope filter
  compileWithScope(
    agents: AgentDefinition[],
    config: AigentTeamConfig,
    scope: GenerateScope
  ): CompiledOutput[] {
    switch (scope) {
      case 'agents':
        return this.compileAgentIndexes(agents, config);
      case 'skills':
        return this.compileAllSkills(agents);
      case 'references':
        return this.compileAllReferences(agents);
      case 'plugin':
        return this.compilePlugin(agents, config);
      case 'all':
      default:
        return this.compile(agents, config);  // backward compatible
    }
  }

  // Các method mới — mỗi compiler implement theo platform format
  protected abstract compileAgentIndexes(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[];
  protected abstract compileAllSkills(agents: AgentDefinition[]): CompiledOutput[];
  protected abstract compileAllReferences(agents: AgentDefinition[]): CompiledOutput[];
}
```

### 3. Plugin Compiler (`src/compilers/plugin.compiler.ts`)

Plugin compiler là **platform-agnostic** — output ra Markdown thuần, không phụ thuộc platform format:

```typescript
class PluginCompiler {
  compilePlugin(agents: AgentDefinition[], config: AigentTeamConfig): CompiledOutput[] {
    const outputs: CompiledOutput[] = [];

    // 1. Manifest
    outputs.push(this.createManifest(agents, config));

    // 2. Agent files (platform-agnostic markdown)
    for (const agent of agents) {
      outputs.push(this.compileAgentMarkdown(agent));
      outputs.push(...this.compileAgentSkills(agent));
      outputs.push(...this.compileAgentReferences(agent));
    }

    // 3. Shared knowledge
    outputs.push(...this.compileSharedKnowledge(config));

    return outputs;
  }
}
```

### 4. Thay đổi CLI (`bin/cli.ts`)

```typescript
program
  .command('generate')
  .description('Generate platform-specific config files')
  .option('-p, --platform <platform>', 'Generate for a specific platform only')
  .option('-s, --scope <scopes>', 'Output scope(s), comma-separated: all | agents | skills | references | plugin', 'all')
  .option('-t, --team <teams>', 'Comma-separated team roles to generate (overrides config)')
  .action(async (options) => {
    await runGenerate(process.cwd(), {
      platform: options.platform,
      scope: options.scope?.split(','),
      teams: options.team?.split(','),
    });
  });
```

### 5. Thay đổi `runGenerate()` (`src/cli/generate.ts`)

```typescript
export async function runGenerate(cwd: string, options: GenerateOptions = {}) {
  const config = await loadConfig(cwd);

  // Team filter
  const filteredConfig = options.teams
    ? { ...config, teams: options.teams }
    : config;

  const agents = loadAgents(filteredConfig, cwd);
  const scope = options.scope ?? 'all';

  if (scope === 'plugin') {
    // Plugin mode — platform-agnostic
    const pluginCompiler = new PluginCompiler();
    const outputs = pluginCompiler.compilePlugin(agents, filteredConfig);
    // write outputs...
    return;
  }

  // Normal mode — per platform
  const platforms = options.platform ? [options.platform] : filteredConfig.platforms;
  const compilers = getAllCompilers(platforms);

  for (const compiler of compilers) {
    const outputs = compiler.compileWithScope(agents, filteredConfig, scope);
    // ... validation, writing (same as current)
  }
}
```

---

## Implementation Plan

### Phase 1: `--scope` (agents | skills | references)
1. Thêm `GenerateScope` type vào `types.ts`
2. Refactor `BaseCompiler` — tách compile thành `compileAgentIndexes`, `compileAllSkills`, `compileAllReferences`
3. Update 4 platform compilers để implement các method mới
4. Update `generate.ts` và `cli.ts` để support `--scope`
5. Tests cho từng scope

### Phase 2: `--team` filter
1. Thêm `--team` option vào CLI
2. Filter agents trong `runGenerate()` trước khi pass cho compilers
3. Tests

### Phase 3: Plugin mode (`--scope plugin`)
1. Tạo `PluginCompiler` class (platform-agnostic)
2. Implement manifest generation
3. Implement plugin output structure
4. Tests
5. Docs cho plugin format

### Phase 4: Plugin install
1. `aigent-team install <plugin-path>` — install từ local path
2. `aigent-team install <npm-package>` — install từ npm
3. Install logic per platform:
   - **Claude Code**: copy vào `.claude/agents/`
   - **Cursor**: convert sang `.mdc` format, copy vào `.cursor/rules/`
   - **Codex**: copy vào `.codex/agents/` + update `AGENTS.md`
   - **Antigravity**: copy vào `.agents/skills/`
4. Rollback support — `aigent-team uninstall <plugin-name>`
5. Plugin registry / discovery (future)

---

## Decisions

| # | Question | Decision | Notes |
|---|----------|----------|-------|
| 1 | Plugin output directory | **User config** | Cho phép user config output dir trong `aigent-team.config.json` (field `output.pluginDir`) |
| 2 | Plugin format | **Markdown thuần** | Không cần YAML frontmatter, giữ đơn giản |
| 3 | Plugin install | **Cần `aigent-team install`** | Nhiều platform (ví dụ Cursor) cần install mới hoạt động, không chỉ copy files |
| 4 | Scope combinations | **Cho phép multi-scope** | `--scope agents,skills` hợp lệ. Nếu chọn `plugin` → tự động bao gồm tất cả (agents + skills + references + manifest), không cần kết hợp với scope khác |
| 5 | Plugin versioning | **Semver** | Follow semantic versioning trong manifest.json |

---

## Backward Compatibility

- `aigent-team generate` không có `--scope` → hành vi giống hệt hiện tại (`scope: 'all'`)
- Config schema chỉ thêm optional field `output.pluginDir` — không breaking
- Không thay đổi output paths của các platform compilers hiện có
- Phase 1-3 đều additive, không breaking changes
