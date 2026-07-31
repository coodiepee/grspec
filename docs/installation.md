# Installation

## Prerequisites

- **Node.js 20.19.0 or higher** — Check your version: `node --version`

## Package Managers

### npm

```bash
npm install -g @coodiepee/grspec@latest
```

### pnpm

```bash
pnpm add -g @coodiepee/grspec@latest
```

### yarn

```bash
yarn global add @coodiepee/grspec@latest
```

### bun

Bun can install grspec globally, but grspec currently runs on Node.js.
You still need Node.js 20.19.0 or higher available on `PATH`.

```bash
bun add -g @coodiepee/grspec@latest
```

## Nix

Run grspec directly without installation:

```bash
nix run github:coodie/GrSpec -- init
```

Or install to your profile:

```bash
nix profile install github:coodie/GrSpec
```

Or add to your development environment in `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    grspec.url = "github:coodie/GrSpec";
  };

  outputs = { nixpkgs, grspec, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [ grspec.packages.x86_64-linux.default ];
    };
  };
}
```

## Verify Installation

```bash
grspec --version
```

## Next Steps

After installing, initialize grspec in your project:

```bash
cd your-project
grspec init
```

See [Getting Started](getting-started.md) for a full walkthrough.
