const { spawn, spawnSync } = require("child_process");
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

function killStaleExe() {
  spawnSync("taskkill", ["/F", "/IM", "vn-writer-lab.exe", "/T"], {
    stdio: "ignore",
    windowsHide: true,
  });
}

killStaleExe();

const env = {
  ...process.env,
  PATH: `${cargoBin}${path.delimiter}${process.env.PATH ?? ""}`,
};

const child = spawn(process.execPath, [tauriCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});

const terminateChild = () => {
  if (child.killed || child.exitCode !== null) {
    return;
  }

  spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], {
    stdio: "ignore",
    windowsHide: true,
  });
};

process.on("SIGINT", terminateChild);
process.on("SIGTERM", terminateChild);
process.on("exit", terminateChild);

child.on("exit", (code, signal) => {
  process.off("SIGINT", terminateChild);
  process.off("SIGTERM", terminateChild);
  process.off("exit", terminateChild);

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 0;
});
