/**
 * This version of `@henrygd/queue` supports rate limiting.
 * @module
 */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_rl_exports = {};
__export(index_rl_exports, {
  newQueue: () => newQueue
});
module.exports = __toCommonJS(index_rl_exports);
let Promize = Promise;
let newQueue = (concurrency, rate, interval) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let queue;
  let scheduled = false;
  let startTimes = [];
  let afterRun = () => {
    active--;
    if (--size) {
      run();
    } else {
      donePromise = resolveDonePromise?.();
    }
  };
  let run = () => {
    if (scheduled || !head) return;
    if (active >= concurrency) return;
    if (rate !== void 0 && interval !== void 0) {
      let now = Date.now();
      startTimes = startTimes.filter((t) => now - t < interval);
      if (startTimes.length >= rate) {
        scheduled = true;
        let oldestStart = startTimes[0];
        let delay = interval - (now - oldestStart);
        setTimeout(() => {
          scheduled = false;
          run();
        }, delay);
        return;
      }
      startTimes.push(now);
    }
    active++;
    let curHead = head;
    head = head.a;
    curHead.p().then(
      (v) => (curHead.c(v), afterRun()),
      (e) => (curHead.b(e), afterRun())
    );
    if (head && active < concurrency) {
      run();
    }
  };
  return queue = {
    add(p) {
      let node = { p };
      let promise = new Promize((res, rej) => {
        node.c = res;
        node.b = rej;
      });
      if (head) {
        tail = tail.a = node;
      } else {
        tail = head = node;
      }
      size++;
      run();
      return promise;
    },
    done: () => {
      if (!size) {
        return Promize.resolve();
      }
      if (donePromise) {
        return donePromise;
      }
      return donePromise = new Promize((resolve) => resolveDonePromise = resolve);
    },
    clear() {
      for (let node = head; node; node = node.a) {
        node.b(new Error("Queue cleared"));
      }
      head = tail = null;
      size = active;
      startTimes = [];
      if (!size && donePromise) {
        donePromise = resolveDonePromise?.();
      }
    },
    active: () => active,
    size: () => size,
    all: (fns) => Promize.all(fns.map((fn) => queue.add(typeof fn === "function" ? fn : () => fn)))
  };
};
