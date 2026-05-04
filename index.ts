// Workspace-root entry shim.
//
// Some toolchains (notably expo-cli auto-monorepo detection used by
// `expo-updates`'s "Generate updates resources" Xcode build phase) start
// Metro with the workspace root as the project root. Metro then auto-resolves
// the entry file as `./index.ts` from the workspace root and fails if the
// real entry only exists under `packages/mobile`.
//
// This shim re-exports the mobile entry so the workspace-root resolution
// succeeds. The mobile package keeps its own `packages/mobile/index.ts` for
// `pnpm --filter @machi/mobile start` and other locally-rooted commands.
import './packages/mobile/index'
