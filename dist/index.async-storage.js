/**
 * This version of `@henrygd/queue` supports AsyncLocalStorage / AsyncResource.
 *
 * It should not be used in a web browser.
 * @module
 */
import { AsyncResource } from "async_hooks";
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
    if (!head || active >= concurrency) {
      return;
    }
    active++;
    let curHead = head;
    head = head.next;
    curHead.p().then(curHead.res, curHead.rej).then(afterRun);
  };
  return {
    add: (p) => new Promise((res, rej) => {
      let node = { p: AsyncResource.bind(p), res, rej };
      if (head) {
        tail = tail.next = node;
      } else {
        tail = head = node;
      }
      size++;
      run();
    }),
    done() {
      if (donePromise) {
        return donePromise;
      }
      let np = new Promise((resolve) => resolveDonePromise = resolve);
      if (size) {
        donePromise = np;
      } else {
        resolveDonePromise();
      }
      return np;
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
