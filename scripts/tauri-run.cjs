const { spawn } = require("child_process");
const { homedir } = require("os");
const path = require("path");

const cargoBin = path.join(homedir(), ".cargo", "bin");
const tauriCli = path.join(
  process.cwd(),
  "node_modules",
  "@tauri-apps",
  "cli",
  "tauri.js",
);
const env = {
  ...process.env,
  PATH: `${cargoBin}${path.delimiter}${process.env.PATH ?? ""}`,
};

const child = spawn(process.execPath, [tauriCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 0;
});
