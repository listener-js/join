import { Listener } from "@listener-js/listener"

export class Imp {
  public listeners = [
    "initExternal",
    "listenerInit",
    "listenerReset",
    "loadExternal",
  ]

  private instances: Record<string, any> = {}
  private promises: Record<string, Promise<any>> = {}
  private resolvers: Record<string, Function> = {}

  public initExternal(
    id: string[],
    instanceId: string,
    instance: any
  ): void {
    this.instances[instanceId] = instance
  }

  public listenerInit(
    id: string[],
    instanceId: string,
    instance: any,
    listener: Listener
  ): void {
    listener.listen(
      ["listener.listenerInit", "**"],
      [`${instanceId}.initExternal`],
      { prepend: true }
    )

    listener.listen(
      ["listener.listenerLoad", "**"],
      [`${instanceId}.loadExternal`],
      { prepend: true }
    )
  }

  public listenerReset(): void {
    this.instances = {}
    this.promises = {}
    this.resolvers = {}
  }

  public loadExternal(
    id: string[],
    instanceId: string,
    instance: any,
    listener: Listener,
    options?: Record<string, any>
  ): Promise<any> {
    const promises = this.externalPromises(
      instanceId,
      instance,
      listener
    )

    if (instance.then) {
      instance
        .then(
          (instance): Promise<any> => {
            this.instances[instanceId] = instance

            return listener.listener(
              { [instanceId]: instance },
              options
            )
          }
        )
        .then(() => this.resolvers[instanceId]())
    } else if (instance.externals) {
      for (const joinId of instance.externals) {
        const [loadInstanceId, fnId] = listener.parseId(
          joinId
        )

        if (fnId) {
          if (!instance[fnId]) {
            instance[fnId] = (
              id: string[],
              ...args: any[]
            ): any => {
              return listener.instances[loadInstanceId][
                fnId
              ]([`${instanceId}.${fnId}`, ...id], ...args)
            }
          }
        } else {
          instance[loadInstanceId] =
            listener.instances[loadInstanceId]
        }
      }
    }

    const callbackPromises = this.callbackPromises(
      id,
      instanceId,
      instance,
      listener,
      options
    )

    if (promises.length || callbackPromises.length) {
      return Promise.all(promises).then(() => {
        return Promise.all(callbackPromises)
      })
    }
  }

  private callbackPromises(
    id: string[],
    instanceId: string,
    instance: any,
    listener: Listener,
    options?: Record<string, any>
  ): Promise<any>[] {
    if (!instance.externals) {
      return []
    }

    return instance.externals.reduce((memo, loadId) => {
      const [loadInstanceId] = listener.parseId(loadId)

      if (
        this.instances[loadInstanceId] &&
        this.instances[loadInstanceId].joinListener
      ) {
        const out = this.instances[
          loadInstanceId
        ].joinListener(
          id,
          instanceId,
          instance,
          listener,
          options
        )

        if (out && out.then) {
          return memo.concat(out)
        }
      }

      return memo
    }, [])
  }

  private externalPromises(
    instanceId: string,
    instance: any,
    listener: Listener
  ): Promise<any>[] {
    let promises = []

    if (!instance) {
      return promises
    }

    if (instance.then) {
      this.promises[instanceId] =
        this.promises[instanceId] ||
        new Promise((resolve): void => {
          this.resolvers[instanceId] = resolve
        })

      promises = [this.promises[instanceId]]
    } else if (instance.externals) {
      for (const instanceId of instance.externals) {
        const [loadInstanceId] = listener.parseId(
          instanceId
        )

        promises = promises.concat(
          this.externalPromises(
            loadInstanceId,
            this.instances[loadInstanceId],
            listener
          )
        )
      }
    }

    return promises
  }
}

export const imp = new Imp()
