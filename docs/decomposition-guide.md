# Decomposition Guide

## Core Philosophy

**Every package should have exactly one reason to exist and one reason to change.**

This guide consolidates our decomposition principles, patterns, learnings, and governance processes for maintaining focused, maintainable packages.

## The Five Principles

### 1. Single Purpose
Each package solves ONE specific problem well.

✅ **Good**: `logger` - Only handles logging  
❌ **Bad**: `utils` - Grab bag of unrelated utilities

### 2. Clear Boundaries
A package's name should tell you exactly what it does.

✅ **Good**: `markdown-processor` - Processes markdown  
❌ **Bad**: `core` - What does "core" even mean?

### 3. Size Limits
Keep packages small and focused.

**Rules of thumb:**
- < 10 source files
- Target: < 2000 lines of code (ideal: < 1000)
- < 5 public exports
- If explaining takes > 1 paragraph, split it

**Note**: While we target < 1000 lines, some packages like test-mocks (1,757 lines) and di-framework (1,261 lines) exceed this while maintaining single responsibility. Focus on cohesion over arbitrary limits.

### 4. Dependency Direction
Dependencies flow from specific → general.

```
report-generator → markdown-compiler → file-system → logger
     (app)            (feature)         (utility)    (infra)
```

### 5. Test in Isolation
If you can't test it without mocking half the world, it's too coupled.

## Decomposition Patterns & Strategies

### Interface-First Design
Define capability, not implementation:

```typescript
// Define clear contracts
export interface IMarkdownProcessor {
  process(filePath: string, options?: IProcessOptions): Promise<IProcessResult>;
}

// Separate concerns into focused interfaces
export interface IIncludeParser {
  parse(content: string, basePath: string): IIncludeDirective[];
}
```

### Dependency Injection Container
Inversify provides excellent context isolation:

```typescript
// Central configuration, not scattered dependencies
export function configureContainer(container: Container): void {
  container.bind<ILogger>(TYPES.ILogger).to(WinstonLogger);
  container.bind<IFileSystem>(TYPES.IFileSystem).to(NodeFileSystem);
}
```

### Vertical Slice Architecture
Organize by feature instead of layers:

```
packages/
├── report-generator/
│   ├── src/
│   │   ├── generate-report/     # Complete feature
│   │   ├── check-dependencies/   # Another feature
│   │   └── shared/              # Truly shared code
```

### Context Mapping
Define explicit boundaries between contexts:

```typescript
// Context boundary definition
export interface IReportContext {
  generator: IReportGenerator;
  validator: IReportValidator;
}

// Context adapter for integration
export class MarkdownToReportAdapter {
  constructor(
    private markdown: IMarkdownContext,
    private report: IReportContext
  ) {}
}
```

## Key Learnings from Implementation

### Success Metrics Achieved
- **Average package size**: ~418 lines (41.8% of 1000 line limit)
- **Test coverage**: 84-100% across all packages
- **Zero circular dependencies**
- **100% testable in isolation**

### Patterns That Worked

#### 1. Documentation-First Development
Writing CLAUDE.md before implementation:
- Forces clear thinking about boundaries
- Prevents scope creep
- Serves as living documentation

#### 2. Error Handling as First-Class Concern
```typescript
export class FileNotFoundError extends FileSystemError {
  constructor(path: string, operation: string, cause?: Error) {
    super(`File not found: ${path}`, 'ENOENT', operation, cause);
    this.path = path;
  }
}
```

#### 3. Single Responsibility = Natural Size Control
When packages have one clear purpose:
- Size naturally stays small
- APIs are intuitive
- Testing is straightforward

## Anti-Patterns to Avoid

### 1. The Kitchen Sink
```typescript
// ❌ utils package
export { formatDate } from './date';
export { readFile } from './file';
export { Logger } from './logger';
```

### 2. The God Package
```typescript
// ❌ markdown - Does everything
export class MarkdownProcessor {
  parse() { }
  render() { }
  compile() { }
  validate() { }
  transform() { }
}
```

### 3. Circular Dependencies
```typescript
// ❌ These packages depend on each other
// auth → user → auth
```

## Governance Process

### Package Creation Review
Before creating any new package:
- [ ] Complete a Package Decision Record
- [ ] Review against all 5 principles
- [ ] Document any exceptions with rationale
- [ ] Ensure package has single, clear purpose

### Package Monitoring
- **Weekly**: Check package sizes during reviews
- **Monthly**: Full audit against principles
- **Automated**: Size and dependency checks in CI/CD

### Key Metrics
1. **Package Size** (target: < 1000 lines)
2. **Dependency Count** (target: < 3)
3. **Purpose Clarity** (explain in one sentence)
4. **API Surface** (target: < 5 public exports)

## Quick Decision Tree

1. **Can you describe it in one sentence without "and"?**
   - No → Split it

2. **Would someone use just part of it?**
   - Yes → Split that part out

3. **Do different parts change for different reasons?**
   - Yes → Split them

4. **Is it over 1000 lines?**
   - Yes → Find a natural split point

## Implementation Workflow

### Package Creation Steps
1. Write CLAUDE.md first (context boundaries)
2. Create interface file (public API)
3. Write mock implementation (for testing)
4. Implement real version
5. Add comprehensive tests
6. Update consuming projects

### Package Structure Template
```
package-name/
├── src/
│   ├── interfaces/     # Public API
│   ├── implementations/ # Internal only
│   ├── errors/         # Domain-specific errors
│   └── index.ts        # Explicit exports
├── tests/
├── CLAUDE.md           # Context documentation
└── README.md           # Usage examples
```

## When to Split vs. Keep Together

### Split When:
- Two features change for different reasons
- You're using "and" to describe what it does
- Different teams would own different parts
- One part is useful without the other

### Keep Together When:
- They always change together
- Splitting creates circular dependencies
- The abstraction would be forced/artificial
- Combined size is still < 1000 lines

## Remember

**It's easier to combine two packages later than to split one package.**

When in doubt, keep them separate. You can always create a facade package that combines them if needed.
