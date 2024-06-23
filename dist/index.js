let newQueue = (concurrency) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let Promize = Promise;
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
      head = head.a;
      curHead.p().then(
        (v) => {
          curHead.b(v);
          afterRun();
        },
        (e) => {
          curHead.c(e);
          afterRun();
        }
      );
    }
  };
  return {
    add: (p) => new Promize((res, rej) => {
      let node = { p, b: res, c: rej };
      if (head) {
        tail = tail.a = node;
      } else {
        tail = head = node;
      }
      size++;
      run();
    }),
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
