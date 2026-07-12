{
  description = "Development shell for Slay PDF";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      supportedSystems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: import nixpkgs { inherit system; };
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShellNoCC {
            name = "slay-pdf";

            packages = with pkgs; [
              git
              jq
              nixpkgs-fmt
              nodejs_24
            ];

            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
              export npm_config_update_notifier=false

              echo "slay-pdf dev shell: node $(node --version), npm $(npm --version)"
            '';
          };
        });

      formatter = forAllSystems (system: (pkgsFor system).nixpkgs-fmt);
    };
}
