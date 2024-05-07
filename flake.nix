{
  description = "jakob-kruse.de";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-23.11";
  };

  outputs = { self, nixpkgs }: {
    devShell.x86_64-linux = with nixpkgs.legacyPackages.x86_64-linux; mkShell {
      buildInputs = [
        nodejs_21
        nodePackages.pnpm
      ];

      shellHook = ''
        export PATH=$PATH:./node_modules/.bin
        alias ni="pnpm install"
        alias nr="pnpm run"
      '';
    };
  };
}
