/**
 * This version of `@henrygd/queue` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
 * @module
 */
import { AsyncResource } from "async_hooks";
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
      let node = { p: AsyncResource.bind(p) };
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
export {
  newQueue
};
