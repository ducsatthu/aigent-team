# RFC-002: Skill Content Layers Architecture

> Status: **Draft — Under Evaluation**
> Author: ducsatthu
> Date: 2026-03-31

## Proposal

Chia nội dung skill thành 8 lớp (layers) có thứ tự ưu tiên rõ ràng, từ mục đích tồn tại đến quản trị vòng đời.

| Layer   | Tên                    | Mô tả                                                                            |
| ------- | ---------------------- | -------------------------------------------------------------------------------- |
| Layer 0 | Use Case & Trigger Map | Xác định skill sinh ra để giải quyết việc gì, ai dùng, trong bối cảnh nào        |
| Layer 1 | Metadata               | Lớp mô tả ngắn nhưng quyết định việc skill có được gọi đúng hay không            |
| Layer 2 | Core SKILL.md          | Lớp chỉ dẫn cốt lõi: mục tiêu, phạm vi, quy trình, nguyên tắc                  |
| Layer 3 | References             | Lớp tri thức nền được tải khi cần: schema, chính sách, SOP, tài liệu nghiệp vụ  |
| Layer 4 | Examples               | Lớp ví dụ mẫu giúp AI nhìn thấy chuẩn đầu vào, đầu ra và cách xử lý thực tế    |
| Layer 5 | Scripts & Tools        | Lớp thực thi, tự động hóa hoặc kiểm tra để giảm lặp lại và tăng độ ổn định       |
| Layer 6 | Assets & Templates     | Lớp tài nguyên đầu ra: template, slide, mẫu báo cáo, checklist                   |
| Layer 7 | Output Contract & QC   | Lớp quy định tiêu chuẩn đầu ra: định dạng, rubric, tiêu chí đúng/sai, self-check|
| Layer 8 | Governance & Evolution | Lớp quản trị: version, owner, review, phê duyệt, theo dõi hiệu quả, cải tiến   |

---

## Evaluation

### Strengths — Điểm mạnh

**1. Phân tách rõ ràng giữa "biết gì" và "làm gì"**

Hiện tại hệ thống gộp metadata + core + references thành 3 cấp. Proposal này tách mịn hơn — đặc biệt Layer 0 (Use Case & Trigger Map) là điều hệ thống hiện tại **hoàn toàn thiếu**. Hiện skill chỉ có `id`, `title`, `description` trong frontmatter — không mô tả rõ khi nào nên trigger, ai là người dùng chính, và bối cảnh phù hợp. Điều này dẫn đến AI gọi sai skill hoặc không gọi khi cần.

**2. Examples layer (Layer 4) giải quyết đúng pain point**

Few-shot examples là cách hiệu quả nhất để steer LLM output quality. Hiện hệ thống không có layer này — skill chỉ nói "làm gì" mà không cho thấy "làm ra trông như thế nào". Đây là gap lớn nhất khi skill phức tạp (ví dụ: BA viết acceptance criteria — không có example thì output rất random).

**3. Output Contract (Layer 7) cho phép self-validation**

Nếu AI biết rõ rubric và tiêu chí đúng/sai, nó có thể tự kiểm tra trước khi trả output. Đây là pattern đã proven hiệu quả — giống "grading rubric" trong prompt engineering.

**4. Progressive loading vẫn hoạt động**

Các layer có thể map tự nhiên vào cơ chế on-demand loading hiện tại:
- **Always loaded**: Layer 0 + 1 (nhẹ, cần cho trigger decision)
- **Loaded on skill invocation**: Layer 2 + 7 (core + contract)
- **Loaded on demand**: Layer 3 + 4 + 5 + 6 (nặng, chỉ cần khi thực thi)
- **Never loaded by AI**: Layer 8 (governance — cho con người)

### Concerns — Điểm cần cân nhắc

**1. Layer 0 vs Layer 1 có ranh giới mờ**

Use Case & Trigger Map (L0) và Metadata (L1) phục vụ cùng mục đích: giúp hệ thống (hoặc AI) quyết định có gọi skill này không. Trong thực tế:
- Trigger conditions → nên nằm trong metadata (frontmatter) để compiler đọc được
- "Ai dùng, bối cảnh nào" → cũng là metadata

**Gợi ý:** Gộp L0 vào L1 dưới dạng structured fields trong frontmatter (`triggers`, `actors`, `context`). Hoặc giữ tách nhưng cần ví dụ cụ thể cho thấy sự khác biệt giữa hai layer.

**2. L5 (Scripts & Tools) vs L6 (Assets & Templates) — phân tách hợp lý**

Việc tách riêng executable logic (L5) và static output templates (L6) là quyết định đúng:
- L5 = **code chạy được**: bash scripts, automation, validation tools → cần sandbox, permission model
- L6 = **tài nguyên tĩnh**: template markdown, slide format, checklist mẫu → load nguyên văn, AI điền vào

Điểm cần làm rõ:
- L5 là thay đổi kiến trúc lớn nhất — hiện hệ thống không có execution layer. Cần thiết kế permission model, error handling, và cơ chế chạy script trong sandbox.
- L6 đơn giản hơn nhiều — có thể triển khai tương tự references (on-demand file loading). AI đọc template rồi fill in, không cần execution engine.

**4. Layer 8 (Governance) không phải content cho AI**

Version, owner, review process — đây là metadata cho con người quản lý, không phải content AI cần đọc. Nên cân nhắc:
- Governance fields nằm trong frontmatter (version, owner, lastReviewed) → compiler đọc được, hiển thị trong manifest
- Governance process nằm trong docs/ cho con người, không compile vào agent output

**5. Context window budget**

8 layers đầy đủ cho 1 skill có thể chiếm 2000-5000 tokens. Với 6 agents × 3-8 skills mỗi agent = 36,000-240,000 tokens nếu load hết. Cần strategy rõ ràng:
- Bao nhiêu layers được load cùng lúc?
- Layer nào là mandatory, layer nào optional?
- Cơ chế "layer budget" per invocation?

### Mapping to Current Architecture

| Layer | Hiện tại đã có? | Nằm ở đâu | Gap |
|-------|-----------------|------------|-----|
| L0 — Use Case & Trigger | Không | — | Hoàn toàn thiếu |
| L1 — Metadata | Có (cơ bản) | `agent.yaml` frontmatter | Thiếu trigger, actors, context |
| L2 — Core Skill | Có | `skill.md`, `skills/*.md` | Đã đủ |
| L3 — References | Có | `references/*.md` | Đã đủ |
| L4 — Examples | Không | — | Hoàn toàn thiếu |
| L5 — Scripts & Tools | Không | — | Hoàn toàn thiếu, cần thiết kế execution model |
| L6 — Assets & Templates | Không | — | Hoàn toàn thiếu, triển khai tương tự references |
| L7 — Output Contract | Một phần | Nằm rải rác trong skill.md | Chưa structured |
| L8 — Governance | Không | — | Chưa cần thiết ở giai đoạn hiện tại |

### Recommended Priority

Nếu triển khai, nên đi theo thứ tự impact/effort:

1. **L4 — Examples** (high impact, low effort) — Thêm `examples/` directory vào mỗi skill, compiler load on-demand. Cải thiện output quality ngay lập tức.
2. **L0+L1 — Merge trigger info vào metadata** (high impact, medium effort) — Mở rộng frontmatter schema với `triggers`, `actors`, `context`. Cải thiện skill routing.
3. **L7 — Output Contract** (medium impact, low effort) — Thêm section `## Output Contract` vào cuối mỗi skill.md. Không cần thay đổi kiến trúc.
4. **L6 — Assets & Templates** (medium impact, low effort) — Thêm `templates/` directory, load tương tự references. AI đọc template rồi fill in.
5. **L5 — Scripts & Tools** (medium impact, high effort) — Cần thiết kế execution model, sandbox, permission. Nên làm RFC riêng.
6. **L8 — Governance** (low impact for now) — Thêm fields vào frontmatter khi scale lên nhiều contributors.

---

## Open Questions

1. Layer 0 và Layer 1 nên gộp hay giữ tách? Cần ví dụ cụ thể để phân biệt.
2. L5 (Scripts & Tools) cần execution model thế nào? Sandbox, permission, error handling?
3. L6 (Assets & Templates) — format chuẩn cho templates? Markdown-only hay cho phép structured formats (JSON, YAML)?
4. Context budget strategy cho progressive loading các layers?
5. Backward compatibility: skills hiện tại không có L0/L4/L5/L6/L7 — migration path thế nào?
6. Guardrails & Edge Cases nên nằm ở đâu? Trong L2 (Core Skill) hay tách riêng?
