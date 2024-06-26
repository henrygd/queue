/**
 * This version of `@henrygd/queue` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
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
var index_async_storage_exports = {};
__export(index_async_storage_exports, {
  newQueue: () => newQueue
});
module.exports = __toCommonJS(index_async_storage_exports);
var import_async_hooks = require("async_hooks");
let Promize = Promise;
let newQueue = (concurrency) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let afterRun = () => {
    active--;
    if (--size) {
      run();
    } else {
      donePromise = resolveDonePromise?.();
    }
  };
  let run = () => {
    if (head && active < concurrency) {
      active++;
      let curHead = head;
      head = head.next;
      curHead.p().then(
        (v) => (curHead.res(v), afterRun()),
        (e) => (curHead.rej(e), afterRun())
      );
    }
  };
  return {
    add(p) {
      let node = { p: import_async_hooks.AsyncResource.bind(p) };
      let promise = new Promize((res, rej) => {
        node.res = res;
        node.rej = rej;
      });
      if (head) {
        tail = tail.next = node;
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
      head = tail = null;
      size = active;
    },
    active: () => active,
    size: () => size
  };
};
