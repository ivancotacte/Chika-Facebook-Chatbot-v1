{ pkgs }: {
	deps = [
		pkgs.nodePackages.prettier
		pkgs.busybox
  pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
	];
}