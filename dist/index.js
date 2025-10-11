let Promize = Promise;
let newQueue = (concurrency) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let queue;
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
        (v) => (curHead.b(v), afterRun()),
        (e) => (curHead.c(e), afterRun())
      );
    }
  };
  return queue = {
    add(p) {
      let node = { p };
      let promise = new Promize((res, rej) => {
        node.b = res;
        node.c = rej;
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
      head = tail = null;
      size = active;
    },
    active: () => active,
    size: () => size,
    all: (fns) => Promize.all(fns.map((fn) => queue.add(typeof fn === "function" ? fn : () => fn)))
  };
};
export {
  newQueue
};
