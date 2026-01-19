export default class AdvectLog {
  static log : AdvectLog = new AdvectLog();
  #channel: BroadcastChannel;
  constructor(){
    this.#channel = new BroadcastChannel("advect:console");

  }
  log(msg: any) {
    this.#channel.postMessage({ ...msg, ___type: "log" });
  }
  warn(msg: any) {
    this.#channel.postMessage({ ...msg, ___type: "warn" });
  }
  error(msg: any) {
    this.#channel.postMessage({ ...msg, ___type: "error" });
  }
  dir(msg: any) {
    this.#channel.postMessage({ ...msg, ___type: "dir" });
  }
  table(msg: any) {
    this.#channel.postMessage({ ...msg, ___type: "table" });
  }
}
