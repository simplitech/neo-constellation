import Exception from '@/model/Exception'

export default async function settle<T>(promises: Array<Promise<T>>) {
    const values = await Promise.all(promises.map((p) => p.catch((e) => e)))

    for (const value of values) {
      if (value instanceof Exception) {
        throw value
      }
    }

}
