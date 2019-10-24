import join, { ListenerJoinEvent } from "../src"

import expect from "expect"

import {
  load,
  reset,
  ListenerEvent,
} from "@listener-js/listener"

import log from "@listener-js/log"

function delay(t: number, v?: any): Promise<any> {
  return new Promise((resolve): void => {
    setTimeout(resolve.bind(null, v), t)
  })
}

beforeEach((): void => {
  reset(["beforeEach"])
  load(["beforeEach"], { log })
})

it("instance listener function", async (): Promise<any> => {
  expect.assertions(6)

  let test: Test = null,
    test2: Test2 = null

  class Test {
    join: typeof join.join

    fn(lid: string[]): void {
      expect(0).toBe(1)
    }

    listenerLoaded(
      lid: string[],
      { instance, listener }: ListenerEvent
    ): void {
      this.join(lid, instance.id, "test2.fn")
    }
  }

  class Test2 {
    fn(lid: string[]): void {
      expect(lid).toEqual(["test2.fn", "test.fn", "hi"])
    }

    listenerJoined(
      lid,
      { instance, joinInstance }: ListenerJoinEvent
    ): void {
      expect(lid).toEqual([
        "test2.listenerJoined",
        "join.callListenerJoined",
        "test2",
        "listener.listenerAfterLoaded",
        "test",
        "listener.callListenerAfterLoaded",
        "test",
        "listener.load",
        "c",
      ])
      expect(instance.id).toBe("test2")
      expect(instance).toBe(test2)
      expect(joinInstance.id).toBe("test")
      expect(joinInstance).toBe(test)
    }
  }

  test = new Test()
  test2 = new Test2()

  load([], { test2 })
  // eslint-disable-next-line sort-keys
  load([], { test, join })

  test.fn(["hi"])
})

it("instance listener", (): void => {
  expect.assertions(3)

  class Test {
    join: typeof join.join

    private listenerLoaded(
      lid: string[],
      { instance, listener }: ListenerEvent
    ): void {
      this.join(lid, instance.id, "test2")
    }

    public test2: Test2
  }

  const test = new Test()

  class Test2 {
    public fn(lid: string[]): void {
      expect(lid).toEqual(["test2.fn", "hi"])
    }

    private listenerJoined(
      lid,
      { instance, joinInstance }: ListenerJoinEvent
    ): void {
      expect(instance.id).toBe("test2")
      expect(joinInstance.id).toBe("test")
    }
  }

  const test2 = new Test2()

  // eslint-disable-next-line sort-keys
  load([], { test, test2, join })

  test.test2.fn(["hi"])
})

it("async listener instance", async (): Promise<
  Record<string, any>
> => {
  expect.assertions(1)

  const test = {
    fn: (lid: string[]): void => {
      expect(lid).toEqual(["test.fn", "hi"])
    },
  }

  const promise = delay(1, test)

  // eslint-disable-next-line sort-keys
  return load([], { test: promise, join }).then(
    (): void => {
      test.fn(["hi"])
    }
  )
})

it("async listener wait for dependency", (): Promise<
  any
> => {
  expect.assertions(1)

  class Test {
    join: typeof join.join

    fn(lid: string[]): void {
      expect(0).toBe(1)
    }

    listenerLoaded(
      lid: string[],
      { instance, listener }: ListenerEvent
    ): void {
      this.join(lid, instance.id, "test2.fn")
    }
  }

  const test2 = {
    fn: (lid: string[]): void => {
      expect(lid).toEqual(["test2.fn", "test.fn", "hi"])
    },
  }

  const test = new Test()
  const asyncTest = delay(1, test)

  const promise = load([], {
    test: asyncTest,
    // eslint-disable-next-line sort-keys
    join,
  }).then(({ test }): void => {
    test.fn(["hi"])
  })

  load([], { test2 })

  return promise
})

it("async join callback", async (): Promise<any> => {
  expect.assertions(4)

  let test: Test = null

  class Test {
    join: typeof join.join

    fn(lid: string[]): void {
      expect(0).toBe(1)
    }

    listenerLoaded(
      lid: string[],
      { instance, listener }: ListenerEvent
    ): void {
      this.join(lid, instance.id, "test2.fn")
    }
  }

  const test2 = {
    fn: (): void => {},
    listenerJoined: async (
      lid: string,
      { instance, joinInstance }: ListenerJoinEvent
    ): Promise<any> => {
      return delay(1).then((): void => {
        expect(instance.id).toBe("test2")
        expect(instance).toEqual(test2)
        expect(joinInstance.id).toBe("test")
        expect(joinInstance).toEqual(test)
      })
    },
  }

  test = new Test()

  // eslint-disable-next-line sort-keys
  return load([], { test, test2, join })
})
