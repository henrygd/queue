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
  let run = async () => {
    if (!head || active >= concurrency) {
      return;
    }
    active++;
    let curHead = head;
    head = head.next;
    try {
      curHead.res(await curHead.p());
    } catch (e) {
      curHead.rej(e);
    }
    active--;
    if (--size) {
      run();
    } else {
      resolveDonePromise?.();
    }
  };
  return {
    add(p) {
      let node = {
        p: AsyncResource.bind(p)
      };
      let promise = new Promise((res, rej) => {
        node.res = res;
        node.rej = rej;
      });
      if (head) {
        tail.next = node;
        tail = node;
      } else {
        head = tail = node;
      }
      size++;
      run();
      return promise;
    },
    done: () => {
      return new Promise((resolve) => {
        resolveDonePromise = resolve;
        if (!size) {
          resolveDonePromise();
        }
      });
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
