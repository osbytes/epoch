# @epoch/react

> React hooks and provider for Epoch multi-step form flows.

## Install

```bash
npm install @epoch/react zod react react-dom
# or
pnpm add @epoch/react zod react react-dom
```

`@epoch/core` is included automatically.

## Usage

```tsx
import { createFormFlow } from '@epoch/core'
import { FormFlowProvider, useFormFlow } from '@epoch/react'

const flow = createFormFlow({
  schema: MySchema,
  steps: { step1: ['field1'], step2: ['field2'] },
})

function App() {
  return (
    <FormFlowProvider flow={flow}>
      <MyStep />
    </FormFlowProvider>
  )
}
```

## What about React Hook Form?

Epoch provides its own lightweight controlled-state form handling (`values` / `setValues`). You can use it **alongside** React Hook Form if you prefer — for example, using RHF inside individual steps for advanced field-level validation — but **React Hook Form is not required**.

## Documentation

Full guides and API reference live in the [repository docs folder](https://github.com/osbytes/epoch/tree/main/docs). Browse the rendered site locally with `pnpm docs:dev`, or at [the published docs site](https://osbytes.github.io/epoch/) once GitHub Pages is enabled.

## Compatibility

| Peer | Versions |
|------|-----------|
| React / React DOM | `^18.0.0 \|\| ^19.0.0` |
| Zod | `^3.22.0` |
| tRPC client / server | `^10.0.0 \|\| ^11.0.0` (optional) |

## License

MIT © Epoch Contributors