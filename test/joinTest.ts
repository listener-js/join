import join from "../"

import {
  load,
  reset,
  ListenerBind,
} from "@listener-js/listener"

import { log } from "@listener-js/log"

function delay(t: number, v?: any): Promise<any> {
  return new Promise((resolve): void => {
    setTimeout(resolve.bind(null, v), t)
  })
}

beforeEach((): void => {
  reset(["beforeEach"])
  load(["beforeEach"], { log })
})

test("instance listener function", async (): Promise<
  any
> => {
  expect.assertions(6)

  const test = {
    fn: (id: string[]): void => {},
    listenerJoin: (lid): string[][] => [["test2.fn"]],
  }

  const test2 = {
    fn: (lid: string[]): void => {
      expect(lid).toEqual(["test2.fn", "test.fn", "hi"])
    },
    instanceJoined: (
      lid,
      instanceId,
      instance,
      joinId,
      joinInstance
    ): void => {
      expect(lid).toEqual([
        "test2.instanceJoined",
        "join.instanceJoined",
        "test2",
        "join.instancesJoined",
        "join.anyInstanceLoaded",
        "listener.instanceLoaded",
        "test",
        "listener.instancesLoaded",
        "listener.load",
      ])
      expect(instanceId).toBe("test2")
      expect(instance).toBe(test2)
      expect(joinId).toBe("test")
      expect(joinInstance).toBe(test)
    },
    listenerBind: (
      lid: string[],
      instanceId: string
    ): ListenerBind => {
      return [
        [
          ["join.instanceJoined", instanceId, "**"],
          `${instanceId}.instanceJoined`,
        ],
      ]
    },
  }

  // eslint-disable-next-line sort-keys
  load([], { test, test2, join })

  test.fn(["hi"])
})

test("instance listener", (): void => {
  expect.assertions(3)

  class Test {
    private listenerJoin(lid): string[][] {
      return [["test2"]]
    }
    public test2: Test2
  }

  const test = new Test()

  class Test2 {
    public fn(lid: string[]): void {
      expect(lid).toEqual(["test2.fn", "hi"])
    }

    private instanceJoined(
      lid,
      instanceId,
      instance,
      joinId
    ): void {
      expect(instanceId).toBe("test2")
      expect(joinId).toBe("test")
    }

    private listenerBind(
      lid: string[],
      instanceId: string
    ): ListenerBind {
      return [
        [
          ["join.instanceJoined", instanceId, "**"],
          `${instanceId}.instanceJoined`,
        ],
      ]
    }
  }

  const test2 = new Test2()

  // eslint-disable-next-line sort-keys
  load([], { test, test2, join })

  test.test2.fn(["hi"])
})

test("async listener instance", async (): Promise<
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

test("async listener wait for dependency", (): Promise<
  any
> => {
  expect.assertions(1)

  const test = {
    fn: undefined,
    listenerJoin: (lid): string[][] => [["test2.fn"]],
  }

  const test2 = {
    fn: (lid: string[]): void => {
      expect(lid).toEqual(["test2.fn", "test.fn", "hi"])
    },
  }

  const asyncTest = delay(1, test)

  const promise = load([], {
    test: asyncTest,
    // eslint-disable-next-line sort-keys
    join,
  }).then((): void => {
    test.fn(["hi"])
  })

  load([], { test2 })

  return promise
})

test("async join callback", async (): Promise<any> => {
  expect.assertions(4)

  const test = {
    fn: undefined,
    listenerJoin: (lid): string[][] => [["test2.fn"]],
  }

  const test2 = {
    fn: (): void => {},
    instanceJoined: async (
      lid: string,
      instanceId: string,
      instance: any,
      joinId: string,
      joinInstance: any
    ): Promise<any> => {
      return delay(1).then((): void => {
        expect(instanceId).toBe("test2")
        expect(instance).toEqual(test2)
        expect(joinId).toBe("test")
        expect(joinInstance).toEqual(test)
      })
    },
    listenerBind: (
      lid: string[],
      instanceId: string
    ): ListenerBind => {
      return [
        [
          ["join.instanceJoined", instanceId, "**"],
          `${instanceId}.instanceJoined`,
        ],
      ]
    },
  }

  // eslint-disable-next-line sort-keys
  return load([], { test, test2, join })
})