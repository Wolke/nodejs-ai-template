# nodejs-ai-template

## Project Architecture: Internal Packaging Strategy

This project adopts an **internal packaging strategy**, where stable code is encapsulated into internal packages. The goal is to reduce hallucinations and redundant code generation from Copilot when working on large-scale TypeScript projects.

### Why Use Internal Packaging?

As the codebase grows, LLMs may fail to retain the entire context, which can lead to:
- Rewriting already implemented features
- Generating duplicate or similar code
- Misusing functions or object structures

### Internal Packaging Workflow

#### 1. Extract Stable Logic into Internal Packages
- Path format: `packages/<package-name>/`
- Each package should follow this structure:
  ```bash
  packages/
    your-package/
      src/
        index.ts
        ...other files
      package.json
      tsconfig.json
  ```

#### 2. Define the Single Responsibility of Each Package
Examples:
- `string-utils`: String processing utilities
- `billing-core`: Core billing logic

#### 3. Use Packages in the Main Project
- Manage the workspace using `pnpm` monorepo structure
- Import package functionality with:
  `import { xxx } from '@your-scope/your-package'`
- Ensure the `package.json` of each package contains:
  `"name": "@your-scope/your-package"`

#### 4. Define Clear Entry Points in `index.ts`
Ensure that Copilot can easily identify all exposed functions from each package.

#### 5. Use `copilot.json` or `instruction.md` for Prompting
Enhance the Copilot context by including instructions like:

> Please prioritize using internal packages for all reusable logic in this project. For instance, `@myproject/string-utils` provides commonly used string functions such as `countChar`, `slugify`, and `truncate`. Avoid regenerating similar code.

### Example

#### Package: `string-utils`

**packages/string-utils/src/index.ts**
```ts
export function countChar(str: string, char: string): number {
  return [...str].filter(c => c === char).length;
}
```

**packages/string-utils/package.json**
```json
{
  "name": "@myproject/string-utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

#### Main Program Usage
```ts
import { countChar } from '@myproject/string-utils';

const count = countChar('hello world', 'l'); // 3
```

### Notes
- For nested structures or shared logic, include a README to document usage scenarios and limitations for each package.
- Focus on one package at a time during development to prevent confusion in project context.
- For new/empty projects, first establish a basic project structure and align with your team before modularizing into packages.
- Using internal packages significantly reduces code duplication and improves project maintainability.

[繁體中文版](./README.zh-TW.md)
