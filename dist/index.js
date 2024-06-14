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
    head = head.a;
    try {
      curHead.b(await curHead.p());
    } catch (e) {
      curHead.c(e);
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
      let node = { p };
      let promise = new Promise((res, rej) => {
        node.b = res;
        node.c = rej;
      });
      if (head) {
        tail.a = node;
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
